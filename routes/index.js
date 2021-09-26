const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { ensureAuth } = require('../config/auth');
const User = require('../models/User');
const {getFileStream} = require("../s3");

// Home page
router.get('/', (req,res) => {
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

// image get request
router.get('/images/:key', (req, res) => {
    const key = req.params.key;
    const readStream = getFileStream(key);

    readStream.pipe(res);
})

module.exports = router;