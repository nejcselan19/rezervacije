const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');

const fs = require('fs');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);

// User model
const User = require('../models/User');
const Item = require('../models/Item');
const Reservation = require('../models/Reservation');
const { ensureAuth } = require("../config/auth");

const multer = require("multer");
const path = require("path");
const {uploadFile} = require("../s3");

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


// PAGES

// Register page
router.get('/register', (req,res) => res.render('register', { layout: './layouts/layout'}));

// Login page
router.get('/login', (req,res) => res.render('login', { layout: './layouts/layout'}));

// User profile page
router.get('/profile', ensureAuth, async (req,res) => {
    const items = await Item.find({ ownerId: req.user._id });
    const reservations = await Reservation.find({ userId: req.user._id });

    for(let i = 0; i < reservations.length; i++){
        let resrv = reservations[i];
        let resrvItem = await Item.findById(resrv.itemId);

        reservations[i].data = {
            title: resrvItem.title,
            image: resrvItem.image
        }
    }

    res.render('profile', { user: req.user, items, reservations })
});

// @desc Show user edit page
// @route GET /users/edit/:id
router.get('/edit/:id', ensureAuth, async (req, res) => {
    const user = await User.findOne({
        _id: req.params.id
    })

    if(!user){
        return res.render('errors/404')
    }

    res.render('profile-edit', {
        user
    })
})

// @desc Update user
// @route POST /users/edit/:id
router.post('/edit/:id', ensureAuth, upload, async (req, res) => {
    let newData = req.body;
    let file = req.file;

    if(file){
        const result = await uploadFile(file);
        await unlinkFile(file.path);
        const image = `/images/${result.key}`;

        // add image name to body data
        newData.profilePic = image;
    }

    let user = await User.findById(req.params.id).lean();

    if(!user){
        return res.render('errors/404')
    }

    User.findOneAndUpdate({_id: req.params.id}, newData, {
        new: true,
        runValidators: true,
    }, (err, result) => {
        if(err){
            console.log(err)
        } else {
            req.flash('success_msg', 'User updated successfully!');
            res.redirect('/users/profile')
        }
    });

})




//HANDLING ACTIONS

// Register handle
router.post('/register', (req, res) => {
    const data = req.body;
    const { firstName, lastName, email, phone, address, postalCode, city, password, password2 } = data;
    let errors = [];

    // Check required fields
    if(!firstName || !lastName || !email || !phone || !password || !password2){
        errors.push({ msg: 'Please fill in all fields.' });
    }

    // Check passwords match
    if(password !== password2){
        errors.push({ msg: 'Passwords do not match.' })
    }

    // Check password is at least 6 chars long
    if(password.length < 6){
        errors.push({ msg: 'Password should be at least 6 characters.' })
    }

    if (errors.length > 0) {
        data.errors = errors;
        res.render('register', { ...data, layout: './layouts/layout' });
    } else {
        // Validation passed
        User.findOne({email: email})
            .then(user => {
                if(user){
                    // User exists
                    errors.push({msg: 'Email already registered'});
                    data.errors = errors;
                    res.render('register', data);
                } else {
                    const newUser = new User({
                        firstName,
                        lastName,
                        email,
                        phone,
                        address,
                        postalCode,
                        city,
                        password
                    });
                    // Hash Password
                    bcrypt.genSalt(10, (err, salt) =>
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if(err) throw err;
                            // Set password to hashed
                            newUser.password = hash;
                            // Save user
                            newUser.save()
                                .then(user => {
                                    req.flash('success_msg', 'You are now registered and can log in');
                                    res.redirect('/users/login');
                                })
                                .catch(err => console.log(err));
                        }))
                }
            });
    }
})

//Login handle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/explore',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

//Logout handle
router.get('/logout', ensureAuth, (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out.');
    res.redirect('/users/login');
})

module.exports = router;