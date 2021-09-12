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
    images: [{
        type: String,
    }],
    price: {
        type: Number,
        min: [0, 'Price must be 0 or higher'],
        required: true
    },
    pricePer: {
        type: String,
        required: [true, 'Unit required'],
        enum: ['h', 'd']
    },
    address: {
        type: String
    }
}, { timestamps: true });

const Place = mongoose.model('Place', PlaceSchema);

module.exports = Place;