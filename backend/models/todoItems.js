const mongoose = require('mongoose');

const todoItemsSchema = new mongoose.Schema({
    item: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 500
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    }
}, { timestamps: true });

module.exports = mongoose.model('ToDo', todoItemsSchema);