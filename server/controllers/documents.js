const Document = require('../models/Document');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const { uploadToSFTP, downloadFromSFTP } = require('../utils/sftp');
const { checkAccess, requireOwnerOrAdmin, eqId } = require('../utils/permissions');

const uploadDocument = async (req, res) => {
    try {
        if (req.user.role === 'Viewer') {
            return res.status(403).json({ message: 'Viewers are not allowed to upload documents' });
        }
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const storageType = process.env.STORAGE_TYPE || 'mongodb';
        const newDocument = new Document({
            title: req.body.title || req.file.originalname,
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            uploadedBy: req.user.id,
            storageType,
            tags: req.body.tags ? JSON.parse(req.body.tags) : [],
            versions: [{
                versionNumber: 1,
                fileUrl: ''
            }]
        });

        if (storageType === 'local') {
            const fileName = `${Date.now()}-${req.file.originalname}`;
            const uploadPath = path.join(__dirname, '../uploads', fileName);
            fs.writeFileSync(uploadPath, req.file.buffer);
            newDocument.storagePath = fileName;
        } else if (storageType === 'sftp') {
            const fileName = `${Date.now()}-${req.file.originalname}`;
            const remotePath = `${process.env.SFTP_BASE_PATH || '/uploads'}/${fileName}`;
            await uploadToSFTP(req.file.buffer, remotePath);
            newDocument.storagePath = remotePath;
        } else {
            newDocument.fileData = req.file.buffer;
        }

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
        if (!document) return res.status(404).json({ message: 'Document not found' });

        const access = checkAccess(document, req.user, 'download');
        if (!access.allowed) return res.status(access.status).json({ message: access.reason });

        res.set({
            'Content-Type': document.fileType,
            'Content-Disposition': `attachment; filename="${document.fileName || 'download'}"`,
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
        console.error('Download Error:', err);
        res.status(500).json({ message: err.message });
    }
};

const getDocuments = async (req, res) => {
    try {
        const { tab, search } = req.query;
        let query = { isDeleted: false };
        switch (tab) {
            case 'Sharing':
            case 'Shared with Me':
                query.sharedWith = req.user.id;
                break;
            case 'Starred':
                query.uploadedBy = req.user.id;
                query.isStarred = true;
                break;
            case 'Trash':
                if (req.user.role !== 'Admin') {
                    query.uploadedBy = req.user.id;
                }
                query.isDeleted = true;
                break;
            case 'Recent':
                if (req.user.role !== 'Admin') {
                    query.uploadedBy = req.user.id;
                }
                break;
            default:
                // If Admin, show everything in their personal dashboard too? 
                // Usually better to show their own + shared.
                query.$or = [
                    { uploadedBy: req.user.id },
                    { sharedWith: req.user.id }
                ];
        }

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        // Exclude fileData from query results (it's large)
        let findQuery = Document.find(query)
            .select('-fileData')
            .populate('uploadedBy', 'name email')
            .populate('sharedWith', 'name email');
        
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
        
        const isAdmin = req.user.role === 'Admin';
        const isOwner = String(document.uploadedBy) === String(req.user.id);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized. Only owners or admins can delete documents.' });
        }
        
        if (req.user.role === 'Viewer') {
            return res.status(403).json({ message: 'Viewers are not allowed to delete documents' });
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

        const guard = requireOwnerOrAdmin(document, req.user);
        if (!guard.allowed) return res.status(guard.status).json({ message: guard.reason });

        document.isStarred = !document.isStarred;
        await document.save();
        res.json(document);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Share document with email
const shareDocument = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const document = await Document.findById(req.params.id);
        if (!document) return res.status(404).json({ message: 'Document not found' });

        const guard = requireOwnerOrAdmin(document, req.user);
        if (!guard.allowed) return res.status(guard.status).json({ message: guard.reason });

        const targetUser = await User.findOne({ email });
        if (!targetUser) return res.status(404).json({ message: 'User not found with this email' });

        // Don't share with the owner — they already have full access.
        if (eqId(targetUser._id, document.uploadedBy)) {
            return res.status(400).json({ message: 'Owner already has access' });
        }

        if (!document.sharedWith) document.sharedWith = [];
        const already = document.sharedWith.some(u => eqId(u, targetUser._id));
        if (!already) {
            document.sharedWith.push(targetUser._id);
            await document.save();
        }
        const populated = await Document.findById(document._id)
            .select('-fileData')
            .populate('sharedWith', 'name email');
        res.json({ message: `Document shared with ${targetUser.name}`, document: populated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Remove access from a user
const unshareDocument = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ message: 'userId is required' });

        const document = await Document.findById(req.params.id);
        if (!document) return res.status(404).json({ message: 'Document not found' });

        const guard = requireOwnerOrAdmin(document, req.user);
        if (!guard.allowed) return res.status(guard.status).json({ message: guard.reason });

        document.sharedWith = (document.sharedWith || []).filter(id => !eqId(id, userId));
        await document.save();

        const populated = await Document.findById(document._id)
            .select('-fileData')
            .populate('sharedWith', 'name email');
        res.json({ message: 'Access removed', document: populated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const viewDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) return res.status(404).json({ message: 'Document not found' });

        const access = checkAccess(document, req.user, 'view');
        if (!access.allowed) return res.status(access.status).json({ message: access.reason });

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
        console.error('View Error:', err);
        res.status(500).json({ message: err.message });
    }
};

// Update document metadata (Rename/Tags)
const updateDocumentMetadata = async (req, res) => {
    try {
        const { title, tags } = req.body;
        const document = await Document.findById(req.params.id);
        if (!document) return res.status(404).json({ message: 'Document not found' });

        const access = checkAccess(document, req.user, 'edit');
        if (!access.allowed) return res.status(access.status).json({ message: access.reason });

        if (title) document.title = title;
        if (tags) document.tags = tags;
        document.updatedAt = Date.now();

        await document.save();
        res.json({ message: 'Document updated successfully', document });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const HTMLtoDOCX = require('html-to-docx');

// Update document version (from Editor)
const updateDocumentVersion = async (req, res) => {
    try {
        const { id } = req.params;
        const { htmlContent, type } = req.body; // type can be 'pdf' or 'docx'
        
        const document = await Document.findById(id);
        if (!document) return res.status(404).json({ message: 'Document not found' });

        const access = checkAccess(document, req.user, 'edit');
        if (!access.allowed) return res.status(access.status).json({ message: access.reason });

        // Archive current version
        const currentVersion = {
            versionNumber: document.versions.length + 1,
            fileUrl: document.fileUrl,
            storagePath: document.storagePath,
            fileData: document.fileData,
            updatedBy: req.user.id,
            updatedAt: Date.now()
        };
        document.versions.push(currentVersion);

        // Update with new data
        if (type === 'docx' && htmlContent) {
            const docxBuffer = await HTMLtoDOCX(htmlContent, null, {
                footer: true,
                pageNumber: true,
            });
            
            if (document.storageType === 'local') {
                const newFileName = `v${currentVersion.versionNumber + 1}_${document.fileName}`;
                const filePath = path.join(__dirname, '../uploads', newFileName);
                fs.writeFileSync(filePath, docxBuffer);
                document.storagePath = newFileName;
            } else {
                document.fileData = docxBuffer;
            }
            document.fileSize = docxBuffer.length;
        } else if (req.file) {
            // If it's a PDF or direct file upload from editor
            if (document.storageType === 'local') {
                document.storagePath = req.file.filename;
            } else {
                document.fileData = req.file.buffer;
            }
            document.fileSize = req.file.size;
        }

        document.updatedAt = Date.now();
        await document.save();

        res.json({ message: 'Document version updated', version: currentVersion.versionNumber + 1 });
    } catch (err) {
        console.error('Update Version Error:', err);
        res.status(500).json({ message: err.message });
    }
};

// Owner (or admin) updates the per-document permission toggles.
const ALLOWED_PERM_KEYS = ['canView', 'canDownload', 'canEdit', 'preventScreenshot', 'watermark'];
const ALLOWED_ACCESS_LEVELS = ['public', 'private', 'restricted'];

const updateDocumentPermissions = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) return res.status(404).json({ message: 'Document not found' });

        const guard = requireOwnerOrAdmin(document, req.user);
        if (!guard.allowed) return res.status(guard.status).json({ message: guard.reason });

        const { permissions, accessLevel } = req.body;
        const update = {};

        if (permissions && typeof permissions === 'object') {
            for (const key of ALLOWED_PERM_KEYS) {
                if (key in permissions) update[`permissions.${key}`] = !!permissions[key];
            }
        }
        if (accessLevel) {
            if (!ALLOWED_ACCESS_LEVELS.includes(accessLevel)) {
                return res.status(400).json({ message: `Invalid accessLevel. Allowed: ${ALLOWED_ACCESS_LEVELS.join(', ')}` });
            }
            update.accessLevel = accessLevel;
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({ message: 'No valid permissions or accessLevel provided' });
        }

        const updated = await Document.findByIdAndUpdate(
            req.params.id,
            { $set: update },
            { new: true, runValidators: true }
        )
            .select('-fileData')
            .populate('uploadedBy', 'name email')
            .populate('sharedWith', 'name email');

        res.json(updated);
    } catch (err) {
        console.error('Update Document Permissions Error:', err);
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    uploadDocument,
    getDocuments,
    deleteDocument,
    toggleStar,
    shareDocument,
    downloadDocument,
    viewDocument,
    unshareDocument,
    updateDocumentMetadata,
    updateDocumentVersion,
    updateDocumentPermissions
};
