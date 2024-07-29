const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    contact: Number,
    password: {
        type: String,
        required: true
    },
    image: {
        type: String,
    },
    status: Boolean

});
const User = mongoose.model('User', userSchema);
module.exports = User;