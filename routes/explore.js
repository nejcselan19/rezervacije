const express = require('express');
const router = express.Router();
const ash = require('express-async-handler')

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



// Add handle
router.post('/add', upload, (req, res) => {
    const data = req.body;
    const image = req.file ? req.file.filename : 'defaultItem.png';
    const userId = req.user;
    const { title, shortDesc, longDesc, price, pricePer, address, category } = data;
    let errors = [];

    // Check required fields
    if(!title || !price || !pricePer || !category){
        errors.push({ msg: 'Please fill in all fields.' });
    }

    if (errors.length > 0) {
        data.errors = errors;
        data.image = image;
        res.render('main/explore', { ...data });
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
})

module.exports = router;