require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const methodOverride = require('method-override');

const app = express();

// Passport Config
require('./config/passport')(passport);


// DB Config
const db = process.env.MONGODB_URI;

// Connect to Mongo
mongoose.connect(db, { useNewUrlParser: true })
    .then(() => console.log('MongoDB Connected...'))
    .catch( err => console.log(err));


// EJS
app.use(expressLayouts);
app.set('layout', './layouts/layout-logged')
app.set('view engine', 'ejs');


// Public folder
app.use(express.static('./public'));


// Bodyparser
app.use(express.urlencoded({extended: false}));

// Method override
app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        let method = req.body._method
        delete req.body._method
        return method
    }
}))

// Express Session
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));


//Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global Vars
app.use((req,res,next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
})


//routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/explore', require('./routes/explore'));


const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server started on port ${PORT}, access it on http://localhost:${PORT}`));