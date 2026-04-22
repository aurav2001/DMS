const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    position: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        page: { type: Number, default: 1 }
    },
    type: { type: String, enum: ['general', 'point'], default: 'general' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', commentSchema);
