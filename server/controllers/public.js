const Document = require('../models/Document');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const { downloadFromSFTP } = require('../utils/sftp');

const getPublicData = async (req, res) => {
    try {
        const { search } = req.query;

        // Base query for public documents
        const query = { accessLevel: 'public', isDeleted: false };
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        // Fetch documents
        const documents = await Document.find(query)
            .select('-fileData') // Exclude heavy buffer data
            .populate('uploadedBy', 'name email')
            .sort({ createdAt: -1 });

        // Calculate statistics for the badges
        // 1. Total Public Documents
        const totalDocuments = await Document.countDocuments({ accessLevel: 'public', isDeleted: false });
        
        // 2. Total Contributing Users (users who uploaded at least one public doc)
        const uniqueIssuers = await Document.distinct('uploadedBy', { accessLevel: 'public', isDeleted: false });
        const totalIssuers = uniqueIssuers.length;

        // 3. Total Departments/Categories (Using unique Tags)
        const uniqueTags = await Document.distinct('tags', { accessLevel: 'public', isDeleted: false });
        const totalDepartments = uniqueTags.length;

        res.json({
            documents,
            stats: {
                totalDocuments,
                totalIssuers,
                totalDepartments
            }
        });

    } catch (err) {
        console.error('Public Data Error:', err);
        res.status(500).json({ message: 'Error fetching public data' });
    }
};
const viewPublicDocument = async (req, res) => {
    try {
        const document = await Document.findOne({ _id: req.params.id, accessLevel: 'public', isDeleted: false });
        if (!document || !document.fileData) {
            return res.status(404).json({ message: 'Public file not found' });
        }

        // Enforce View permission if toggled by admin
        if (document.permissions?.canView === false) {
            return res.status(403).json({ message: 'Public viewing for this document is restricted by administrator' });
        }
        
        res.set({
            'Content-Type': document.fileType,
            'Content-Disposition': `inline; filename="${document.fileName || 'view'}"`,
        });

        if (document.storageType === 'local' && document.storagePath) {
            const filePath = path.join(__dirname, '../uploads', document.storagePath);
            if (fs.existsSync(filePath)) {
                res.set('Content-Length', document.fileSize);
                return fs.createReadStream(filePath).pipe(res);
            }
        } else if (document.storageType === 'sftp' && document.storagePath) {
            const data = await downloadFromSFTP(document.storagePath);
            res.set('Content-Length', data.length);
            return res.send(data);
        }

        if (!document.fileData) return res.status(404).json({ message: 'File data not found' });
        res.set('Content-Length', document.fileData.length);
        res.send(document.fileData);
    } catch (err) {
        console.error('View Public Document Error:', err);
        res.status(500).json({ message: 'Error viewing document' });
    }
};

module.exports = { getPublicData, viewPublicDocument };
