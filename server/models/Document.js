const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    fileUrl: { type: String, default: '' },
    fileName: { type: String },
    fileData: { type: Buffer },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: String }],
    isStarred: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Document Permissions
    permissions: {
        canView: { type: Boolean, default: true },
        canDownload: { type: Boolean, default: true },
        canEdit: { type: Boolean, default: false },
        preventScreenshot: { type: Boolean, default: false },
        watermark: { type: Boolean, default: false }
    },
    accessLevel: { type: String, enum: ['public', 'private', 'restricted'], default: 'private' },
    versions: [{
        versionNumber: { type: Number, default: 1 },
        fileUrl: { type: String },
        updatedAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', documentSchema);
