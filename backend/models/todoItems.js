const mongoose = require('mongoose');

const todoItemsSchema = new mongoose.Schema({
        notes: {
            type: String,
            trim: true,
            default: ''
        },
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
    },
    category: {
        type: String,
        trim: true,
        default: ''
    },
    label: {
        type: String,
        trim: true,
        default: ''
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    deadline: {
        type: Date,
        default: null
    },
    completed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('ToDo', todoItemsSchema);