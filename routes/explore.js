const express = require('express');
const router = express.Router();

// Place model
const Place = require('../models/Place');
const User = require('../models/User');
const { ensureAuth } = require("../config/auth");

router.get('/', ensureAuth, (req,res) => { res.render('main/explore', { user: req.user}) })


module.exports = router;