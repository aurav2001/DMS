const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    fileUrl: { type: String, default: '' },
    fileName: { type: String },
    fileData: { type: Buffer, default: null }, // Made optional for FS storage
    storagePath: { type: String, default: '' }, // Path on Local/SFTP storage
    storageType: { type: String, enum: ['mongodb', 'local', 'sftp'], default: 'mongodb' },
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
        canEdit: { type: Boolean, default: true },
        preventScreenshot: { type: Boolean, default: false },
        watermark: { type: Boolean, default: false }
    },
    accessLevel: { type: String, enum: ['public', 'private', 'restricted'], default: 'private' },
    versions: [{
        versionNumber: { type: Number, required: true },
        fileUrl: { type: String },
        storagePath: { type: String },
        fileData: { type: Buffer },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', documentSchema);
