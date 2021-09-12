const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    placeId: {
        type: String,
        required: true
    },
    timeslots: [{
        reservedFrom: {
            type: Date,
            required: true
        },
        reservedTo: {
            type: Date,
            required: true
        }
    }],
    totalCost: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['active', 'cancelled']
    }
}, { timestamps: true });

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;