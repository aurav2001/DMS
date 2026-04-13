const Document = require('../models/Document');
const { put, del } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

const uploadDocument = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        // Add a timestamp to the filename to avoid collisions
        const fileName = `${Date.now()}-${req.file.originalname}`;

        // Upload to Vercel Blob
        const blob = await put(fileName, req.file.buffer, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN
        });

        const newDocument = new Document({
            title: req.body.title || req.file.originalname,
            fileUrl: blob.url,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            uploadedBy: req.user.id,
            tags: req.body.tags ? JSON.parse(req.body.tags) : [],
            versions: [{
                versionNumber: 1,
                fileUrl: blob.url
            }]
        });

        await newDocument.save();
        res.status(201).json(newDocument);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getDocuments = async (req, res) => {
    try {
        const { tab, search } = req.query;
        let query = { isDeleted: false };

        // Handle Tabs
        switch (tab) {
            case 'Shared with Me':
                query.sharedWith = req.user.id;
                break;
            case 'Starred':
                query.uploadedBy = req.user.id;
                query.isStarred = true;
                break;
            case 'Trash':
                query.uploadedBy = req.user.id;
                query.isDeleted = true;
                break;
            case 'Recent':
                query.uploadedBy = req.user.id;
                break;
            default: // My Documents
                query.uploadedBy = req.user.id;
        }

        // Handle Search
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        let findQuery = Document.find(query).populate('uploadedBy', 'name email');
        
        if (tab === 'Recent') {
            findQuery = findQuery.sort({ updatedAt: -1 }).limit(10);
        } else {
            findQuery = findQuery.sort({ createdAt: -1 });
        }

        const documents = await findQuery;
        res.json(documents);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const deleteDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) return res.status(404).json({ message: 'Document not found' });
        
        if (document.uploadedBy.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (document.isDeleted) {
            // Permanent delete if already in trash
            if (document.fileUrl.startsWith('http')) {
                // Delete from Vercel Blob
                await del(document.fileUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
            } else if (fs.existsSync(document.fileUrl)) {
                // Delete from local filesystem (fallback)
                fs.unlinkSync(document.fileUrl);
            }
            await Document.findByIdAndDelete(req.params.id);
            res.json({ message: 'Document deleted permanently' });
        } else {
            // Move to trash
            document.isDeleted = true;
            await document.save();
            res.json({ message: 'Document moved to trash' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const toggleStar = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) return res.status(404).json({ message: 'Document not found' });
        
        document.isStarred = !document.isStarred;
        await document.save();
        res.json(document);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const shareDocument = async (req, res) => {
    try {
        const { userId } = req.body;
        const document = await Document.findById(req.params.id);
        if (!document) return res.status(404).json({ message: 'Document not found' });

        if (!document.sharedWith.includes(userId)) {
            document.sharedWith.push(userId);
            await document.save();
        }
        res.json({ message: 'Document shared successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { uploadDocument, getDocuments, deleteDocument, toggleStar, shareDocument };
