const express = require('express');
const router = express.Router();
const ash = require('express-async-handler')
const fs = require('fs');
require('dotenv').config();
const nodemailer = require('nodemailer');
var ejs = require("ejs");

// Item model
const Item = require('../models/Item');
const User = require('../models/User');
const Reservation = require('../models/Reservation');
const { ensureAuth } = require("../config/auth");

const multer = require("multer");
const path = require("path");

// upload stuff
// Set storage engine - Multer
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function (req, file, cb) {
        cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
})
// Init upload
const upload = multer({
    storage: storage,
    limits:{fileSize: 3000000},
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('itemPicture');
// Check file type
function checkFileType(file, cb) {
    // Allowed extensions
    const fileTypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = fileTypes.test(file.mimetype);

    if(mimetype && extname){
        return cb(null, true);
    } else {
        cb('Error: Only images can be uploaded');
    }
}

// helper functions

// number formatter.
var formatEur = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'EUR',

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
});



// ROUTES
// Explore route
router.get('/', ensureAuth, ash(async(req,res) => {
    const allItems = await Item.find();
    res.render('main/explore', { user: req.user, items: allItems})
}));

// Item route
router.get('/:id', ensureAuth, ash(async(req,res) => {

    const item = await Item.findOne({
        _id: req.params.id
    })

    const existingResrv = await Reservation.find({
        itemId: req.params.id
    })
    console.log(existingResrv);

    if(!item){
        return res.render('errors/404')
    }

    res.render('main/item', {
        item,
        user: req.user,
        existingResrv
    })

}));

// Item edit route
router.get('/edit/:id', ensureAuth, ash(async(req,res) => {

    const item = await Item.findOne({
        _id: req.params.id
    })

    if(!item){
        return res.render('errors/404')
    }

    res.render('main/item-edit', {
        item,
        user: req.user
    })

}));




// HANDLING ACTIONS
// Add item handle
router.post('/add', upload, ash(async(req, res) => {
    const data = req.body;
    const image = req.file ? req.file.filename : 'defaultItem.png';
    const userId = req.user;
    const { title, shortDesc, longDesc, price, address, category } = data;
    let errors = [];

    // Check required fields
    if(!title || !price || !category){
        errors.push({ msg: 'Please fill in all fields.' });
    }

    if (errors.length > 0) {
        data.errors = errors;
        data.image = image;
        const allItems = await Item.find();
        console.log('Grem v bazo po podatke.');
        console.log('Podatki: ', { ...data });
        res.render('main/explore', { ...data, errors, user: req.user, items: allItems, openDialog: 'add-dialog' });
    } else {
        const owner = await User.findOne({
            _id: userId
        });

        // Validation passed
        const newItem = new Item({
            ownerId: userId,
            ownerData: {
               name: owner.firstName + ' ' + owner.lastName,
               email: owner.email,
               phone: owner.phone,
               address: `${owner.address}, ${owner.postalCode} ${owner.city}`
            },
            title,
            shortDesc,
            longDesc,
            image,
            price,
            address,
            category
        });

        // Save item
        newItem.save()
            .then(item => {
                req.flash('success_msg', 'Item added');
                res.redirect('/explore');
            })
            .catch(err => console.log(err));

    }
}))

// Edit item handle
router.post('/edit/:id', ensureAuth, upload, async (req, res) => {
    let newData = req.body;
    let newImage = '';

    if(req.file){
        newImage = req.file.filename;
        if(req.body.old_image !== 'defaultItem.png'){
            try {
                fs.unlinkSync(`./public/uploads/${req.body.old_image}`);
            } catch (err){
                console.log(err);
            }
        }
    } else {
        newImage = req.body.old_image;
    }
    // add image name to body data
    newData.image = newImage;

    let item = await Item.findById(req.params.id).lean();

    if(!item){
        return res.render('errors/404')
    }

    Item.findOneAndUpdate({_id: req.params.id}, newData, {
        new: true,
        runValidators: true,
    }, (err, result) => {
        if(err){
            console.log(err)
        } else {
            req.flash('success_msg', 'Item updated successfully!');
            res.redirect('/explore')
        }
    });

})

// Delete item handle
router.get('/delete/:id', ensureAuth, async (req, res) => {
    let id = req.params.id;

    Item.findByIdAndRemove(id,(err, result) => {
        if(result.image){
            try{
                fs.unlinkSync(`./public/uploads/${result.image}`);
            } catch (err){
                console.log(err);
            }
        }
        if(err){
            res.json({ message: err.message });
        } else {
            req.flash('success_msg', 'Item deleted successfully!');
            res.redirect('/explore')
        }
    });

})

// Add reservation handle
router.post('/:id/reserve', ensureAuth, async (req, res) => {
    let userId = req.user._id;
    let itemId = req.params.id;
    let rb = req.body;
    rb.resrvData = JSON.parse(rb.resrvData);

    console.log(rb);

    let user = await User.findById(userId).exec();
    console.log(user);

    let item = await Item.findById(itemId).exec();
    console.log(item);

    // check if reservation is valid - possible same time reservation TODO
    // Validation passed
    let allReservations = [];

    rb.resrvData.forEach(r => {
        console.log('R -> ', r);
        console.log('UserID -> ', userId);
        console.log('itemId -> ', itemId);
        console.log('r.hours -> ', r.hours);
        allReservations.push({
            userId,
            itemId,
            ownerId: rb.ownerId,
            day: r.day,
            hours: r.hours,
            totalCost: r.totalCost
        })
    })

    Reservation.collection.insertMany(allReservations,(err,docs) => {
        if(err){
            return console.error(err);
        } else {
            console.log('Mulitple documents inserted: ', docs);
            req.flash('success_msg', 'Item added');
            res.redirect('/explore');
        }
    })

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: process.env.HOST,
        port: process.env.PORTSMTP,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.USER, // generated ethereal user
            pass: process.env.PASS, // generated ethereal password
        },
        tls: {
            rejectUnauthorized:false
        }
    });

    ejs.renderFile("./views/template.reservation-mail.ejs", { user, item, allReservations }, function (err, template) {
        if (err) {
            console.log(err);
        } else {
            let mainOptions = {
                from: 'Reservations App <nejcdev@gmail.com>',
                to: user.email,
                subject: "Reservation successful",
                html: template
            };
            transporter.sendMail(mainOptions, function (err, info) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Message sent: ' + info.response);
                }
            });
        }
    });

    ejs.renderFile("./views/template.notify-mail.ejs", { user, item, allReservations }, function (err, template) {
        if (err) {
            console.log(err);
        } else {
            let mainOptions = {
                from: 'Reservations App <nejcdev@gmail.com>',
                to: item.ownerData.email,
                subject: "New reservation",
                html: template
            };
            transporter.sendMail(mainOptions, function (err, info) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Message sent: ' + info.response);
                }
            });
        }
    });
})


module.exports = router;