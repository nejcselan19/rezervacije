const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
    },
    address: {
      type: String,
    },
    postalCode: {
        type: String,
    },
    city: {
        type: String,
    },
    password: {
        type: String,
        required: true
    },
    profilePic: {
        type: String,
        default: '/images/defaultProfile.png'
    }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
module.exports = User;