const Document = require('../models/Document');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const { uploadToSFTP, downloadFromSFTP } = require('../utils/sftp');

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
        const { versionNumber } = req.params;
        let document = await Document.findById(req.params.id);
        if (!document) return res.status(404).json({ message: 'Document not found' });

        // If a specific version is requested
        let fileDataToRes = document.fileData;
        let fileNameToRes = document.fileName;
        let fileTypeToRes = document.fileType;
        let fileSizeToRes = document.fileSize;
        let storagePathToRes = document.storagePath;

        if (versionNumber) {
            const version = document.versions.find(v => v.versionNumber.toString() === versionNumber.toString());
            if (!version) return res.status(404).json({ message: 'Version not found' });
            
            // Note: In this system, 'versions' array contains ARCHIVED versions. 
            // The main document fields (fileData, storagePath) hold the CURRENT version.
            // If the requested version is the latest, it might be the main one or in the array.
                                    
            if (version.fileData) fileDataToRes = version.fileData;
            if (version.storagePath) storagePathToRes = version.storagePath;
            // Assuming name/type stay similar or we could store them in version too
        }

        // Authorization Check
        const isOwner = document.uploadedBy.toString() === req.user.id;
        const isAdmin = req.user.role === 'Admin';
        const isShared = document.sharedWith?.includes(req.user.id);
        const isPublic = document.accessLevel === 'public';

        if (!isOwner && !isAdmin && !isShared && !isPublic) {
            return res.status(401).json({ message: 'Not authorized to access this document' });
        }
        
        // Permission Check: Owner, Admin, and Editors bypass read/download restrictions
        const canEdit = document.permissions?.canEdit === true || req.user.role === 'Editor';
        if (!isOwner && !isAdmin && !canEdit && document.permissions?.canDownload === false) {
            return res.status(403).json({ message: 'Download access is restricted for this document' });
        }
        
        res.set({
            'Content-Type': fileTypeToRes,
            'Content-Disposition': `attachment; filename="${fileNameToRes || 'download'}"`,
        });

        if (document.storageType === 'local' && storagePathToRes) {
            const filePath = path.join(__dirname, '../uploads', storagePathToRes);
            if (fs.existsSync(filePath)) {
                res.set('Content-Length', fileSizeToRes); // Note: might need exact size for old version
                return fs.createReadStream(filePath).pipe(res);
            }
        } else if (document.storageType === 'sftp' && storagePathToRes) {
            const data = await downloadFromSFTP(storagePathToRes);
            res.set('Content-Length', data.length);
            return res.send(data);
        }

        if (!fileDataToRes) return res.status(404).json({ message: 'File data not found' });
        res.set('Content-Length', fileDataToRes.length);
        res.send(fileDataToRes);
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
        
        const isAdmin = req.user.role === 'Admin';
        const isOwner = document.uploadedBy.toString() === req.user.id;

        if (!isOwner && !isAdmin) {
            return res.status(401).json({ message: 'Not authorized. Only owners or admins can delete documents.' });
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

        const targetUser = await User.findOne({ email });
        if (!targetUser) return res.status(404).json({ message: 'User not found with this email' });

        const document = await Document.findById(req.params.id);
        if (!document) return res.status(404).json({ message: 'Document not found' });

        // Add to sharedWith if not already there
        if (!document.sharedWith) document.sharedWith = [];
        if (!document.sharedWith.includes(targetUser._id)) {
            document.sharedWith.push(targetUser._id);
            await document.save();
        }
        res.json({ message: `Document shared with ${targetUser.name}` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Remove access from a user
const unshareDocument = async (req, res) => {
    try {
        const { userId } = req.body;
        const document = await Document.findById(req.params.id);
        if (!document) return res.status(404).json({ message: 'Document not found' });

        document.sharedWith = document.sharedWith.filter(id => id.toString() !== userId);
        await document.save();
        res.json({ message: 'Access removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const viewDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document || !document.fileData) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        // Permission Check: Owner and Admin bypass restrictions
        // Authorization Check
        const isOwner = document.uploadedBy.toString() === req.user.id;
        const isAdmin = req.user.role === 'Admin';
        const isShared = document.sharedWith?.includes(req.user.id);
        const isPublic = document.accessLevel === 'public';

        if (!isOwner && !isAdmin && !isShared && !isPublic) {
            return res.status(401).json({ message: 'Not authorized to access this document' });
        }
        
        // Permission Check: Owner, Admin, and Editors bypass read restrictions
        const canEdit = document.permissions?.canEdit === true;
        if (!isOwner && !isAdmin && !canEdit && document.permissions?.canView === false) {
            return res.status(403).json({ message: 'View access is restricted for this document' });
        }
        
        // Authorization check if needed? The 'auth' middleware is applied, so req.user exists. 
        // For private documents, we might want to check if they have permissions.
        // But for now, if they can see it in their Dashboard, they can issue the request. 
        
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

        const isOwner = document.uploadedBy.toString() === req.user.id;
        const isAdmin = req.user.role === 'Admin';
        const isEditor = req.user.role === 'Editor';
        const isShared = document.sharedWith?.includes(req.user.id);
        
        // Admins and Owners can always edit. 
        // Editors can edit if it's their doc OR if it's shared with them and document level permission doesn't explicitly block them 
        // (but usually Editor role should imply editing if they have access).
        const canEdit = isOwner || isAdmin || (isEditor && isShared) || document.permissions?.canEdit;

        if (!canEdit) {
            return res.status(403).json({ message: 'No permission to edit metadata' });
        }

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

        const isOwner = document.uploadedBy.toString() === req.user.id;
        const isAdmin = req.user.role === 'Admin';
        const isEditor = req.user.role === 'Editor';
        const isShared = document.sharedWith?.includes(req.user.id);
        
        const canEdit = isOwner || isAdmin || (isEditor && isShared) || document.permissions?.canEdit;

        if (!canEdit) {
            return res.status(403).json({ message: 'No permission to edit content' });
        }

        const currentVersionNumber = document.versions.length + 1;
        const archiveVersion = {
            versionNumber: currentVersionNumber,
            fileUrl: document.fileUrl,
            storagePath: document.storagePath,
            fileData: document.fileData,
            updatedBy: req.user.id,
            updatedAt: Date.now()
        };
        document.versions.push(archiveVersion);

        const newVersionNumber = currentVersionNumber + 1;

        // Update with new data
        if (type === 'docx' && htmlContent) {
            try {
                const docxBuffer = await HTMLtoDOCX(htmlContent, null, {
                    footer: true,
                    pageNumber: true,
                });
                
                if (document.storageType === 'local') {
                    const newFileName = `v${newVersionNumber}_${document.fileName}`;
                    const filePath = path.join(__dirname, '../uploads', newFileName);
                    fs.writeFileSync(filePath, docxBuffer);
                    document.storagePath = newFileName;
                } else {
                    document.fileData = docxBuffer;
                }
                document.fileSize = docxBuffer.length;
            } catch (convErr) {
                console.error('Word Conversion Error:', convErr);
                return res.status(400).json({ message: 'Failed to convert HTML to DOCX' });
            }
        } else if (req.file) {
            // If it's a PDF or direct file upload from editor
            if (document.storageType === 'local') {
                const newFileName = `v${newVersionNumber}_${req.file.originalname}`;
                const filePath = path.join(__dirname, '../uploads', newFileName);
                fs.writeFileSync(filePath, req.file.buffer);
                document.storagePath = newFileName;
            } else {
                document.fileData = req.file.buffer;
            }
            document.fileSize = req.file.size;
            document.fileType = req.file.mimetype;
            document.fileName = req.file.originalname;
        } else {
            return res.status(400).json({ message: 'No content or file provided for update' });
        }

        document.updatedAt = Date.now();
        await document.save();

        res.json({ message: 'Document version updated', version: currentVersion.versionNumber + 1 });
    } catch (err) {
        console.error('Update Version Error:', err);
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
    updateDocumentVersion
};
