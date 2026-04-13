const Document = require('../models/Document');

const uploadDocument = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const newDocument = new Document({
            title: req.body.title || req.file.originalname,
            fileName: req.file.originalname,
            fileData: req.file.buffer,
            fileUrl: '',
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            uploadedBy: req.user.id,
            tags: req.body.tags ? JSON.parse(req.body.tags) : [],
            versions: [{
                versionNumber: 1,
                fileUrl: ''
            }]
        });

        await newDocument.save();
        
        // Set fileUrl to the download endpoint
        newDocument.fileUrl = `/api/documents/download/${newDocument._id}`;
        newDocument.versions[0].fileUrl = newDocument.fileUrl;
        await newDocument.save();

        // Don't send fileData back to client
        const doc = newDocument.toObject();
        delete doc.fileData;
        res.status(201).json(doc);
    } catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ message: err.message });
    }
};

const downloadDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document || !document.fileData) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        res.set({
            'Content-Type': document.fileType,
            'Content-Disposition': `attachment; filename="${document.fileName || 'download'}"`,
            'Content-Length': document.fileData.length
        });
        res.send(document.fileData);
    } catch (err) {
        console.error('Download Error:', err);
        res.status(500).json({ message: err.message });
    }
};

const getDocuments = async (req, res) => {
    try {
        const { tab, search } = req.query;
        let query = { isDeleted: false };

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
            default:
                query.uploadedBy = req.user.id;
        }

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        // Exclude fileData from query results (it's large)
        let findQuery = Document.find(query)
            .select('-fileData')
            .populate('uploadedBy', 'name email');
        
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
            await Document.findByIdAndDelete(req.params.id);
            res.json({ message: 'Document deleted permanently' });
        } else {
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

module.exports = { uploadDocument, getDocuments, deleteDocument, toggleStar, shareDocument, downloadDocument };
