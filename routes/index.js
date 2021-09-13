const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { ensureAuth } = require('../config/auth');
const User = require('../models/User');

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

// Dashboard page
router.get('/dashboard', ensureAuth, (req,res) =>
    res.render('dashboard', {
        _pageTitle: 'Home - Logged user',
        _user: req.user
    })
);

module.exports = router;