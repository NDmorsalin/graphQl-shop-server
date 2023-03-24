const { Schema, model } = require('mongoose')

const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    phone: String,
    avatar: String,
    name: {
        firstName: String,
        lastName: String
    },
},{
    timestamps: true
})

const User = model('User', userSchema)

module.exports = User