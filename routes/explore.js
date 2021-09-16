const express = require('express');
const router = express.Router();
const ash = require('express-async-handler')
const fs = require('fs');

// Item model
const Item = require('../models/Item');
const User = require('../models/User');
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


router.get('/', ensureAuth, ash(async(req,res) => {
    const allItems = await Item.find();
    res.render('main/explore', { user: req.user, items: allItems})
}));
// Edit route
router.get('/edit/:id', ensureAuth, ash(async(req,res) => {

    console.log('Params:  ', req.params);
    const item = await Item.findOne({
        _id: req.params.id
    })

    if(!item){
        return res.render('errors/404')
    }

    res.render('main/explore-edit', {
        item,
        user: req.user
    })

}));

// Add handle
router.post('/add', upload, ash(async(req, res) => {
    const data = req.body;
    const image = req.file ? req.file.filename : 'defaultItem.png';
    const userId = req.user;
    const { title, shortDesc, longDesc, price, pricePer, address, category } = data;
    let errors = [];

    // Check required fields
    if(!title || !price || !pricePer || !category){
        errors.push({ msg: 'Please fill in all fields.' });
    }
    console.log('SIZEEE ', req.file.size);
    //Check if file is right size, to throw nicer error than multer
    if(req.file.size >= 3000000){
        errors.push({ msg: 'Image to large. Max allowed size is 3MB.' });
    }

    if (errors.length > 0) {
        data.errors = errors;
        data.image = image;
        const allItems = await Item.find();
        console.log('Grem v bazo po podatke.');
        console.log('Podatki: ', { ...data });
        console.log('Podatki: ', { errors });
        console.log('Podatki: ', { user: req.user});
        console.log('Podatki: ', { openDialog: 'add-dialog' });
        console.log('Podatki: ', { ...data, errors, user: req.user, items: allItems, openDialog: 'add-dialog' });
        res.render('main/explore', { ...data, errors, user: req.user, items: allItems, openDialog: 'add-dialog' });
    } else {
        // Validation passed
        const newItem = new Item({
            ownerId: userId,
            title,
            shortDesc,
            longDesc,
            image,
            price,
            pricePer,
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

// Edit handle
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


module.exports = router;