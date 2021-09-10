const mongoose = require('mongoose');

const PlaceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title required']
    },
    shortDesc: {
        type: String,
        maxlength: [50, `Max characters allowed ({MAXLENGTH}) exceeded!`]
    },
    longDesc: {
        type: String,
        maxlength: [500, `Max characters allowed ({MAXLENGTH}) exceeded!`]
    },
    img: {
        type: String
    },
    price: {
        type: Number,
        min: [0, 'Price must be 0 or higher'],
        required: true
    },
    pricePer: {
        type: String,
        required: [true, 'Category required'],
        enum: ['Keyboard', 'Computer']
    },
    address: {
        type: String,
        required: true
    },
    postalCode: {
        type: String,
        maxlength: [4, 'Wrong postal code'],
        required: true
    },
    city: {
        type: String,
        required: true
    },
    // reservationCalendar: {
    //
    // },
    date: {
        type: Date,
        required: true,
        default: Date.now
    }
});

const Place = mongoose.model('Place', PlaceSchema);

module.exports = Place;