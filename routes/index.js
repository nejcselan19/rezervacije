const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { ensureAuthenticated } = require('../config/auth');
const User = require('../models/User');

// Home page
router.get('/', (req,res) => {
    console.log(req.user);
    if (req.isAuthenticated()) {
        res.render('home', {
            _pageTitle: 'Home - Logged user',
            _user: req.user
        })
    } else {
        res.render('home', {
            _pageTitle: 'Home - No user',
            layout: './layouts/layout'
        })
    }
});

// Dashboard page
router.get('/dashboard', ensureAuthenticated, (req,res) =>
    res.render('dashboard', {
        _pageTitle: 'Home - Logged user',
        _user: req.user
    })
);

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
    limits:{fileSize: 1000000},
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('profilePicture');
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


// Upload handler
router.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if(err){
            res.render('dashboard', {
                msg: err
            })
        } else {
            if(!req.file){
                res.render('dashboard', {
                    msg: 'Error: No file selected'
                });
            } else {
                res.render('dashboard', {
                    msg: 'File uploaded!',
                    image: `uploads/${req.file.filename}`
                })
            }
        }
    });
})

module.exports = router;