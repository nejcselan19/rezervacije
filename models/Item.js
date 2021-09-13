const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    ownerId: mongoose.Types.ObjectId,
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
    image: {
        type: String
    },
    price: {
        type: Number,
        min: [0, 'Price must be 0 or higher'],
        required: [true, 'Price required'],
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

const Item = mongoose.model('Item', ItemSchema);

module.exports = Item;