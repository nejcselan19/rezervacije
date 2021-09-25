const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    itemId: {
        type: String,
        required: true
    },
    ownerId: {
      type: String,
      required: true
    },
    day: {
        type: Number,
        required: true
    },
    hours: {
        type: [Number],
        required: true
    },
    totalCost: {
        type: Number,
        required: true
    }
}, { timestamps: true });

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;