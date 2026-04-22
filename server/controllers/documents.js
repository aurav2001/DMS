const Document = require('../models/Document');
const User = require('../models/User');
const Folder = require('../models/Folder');
const Comment = require('../models/Comment');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { uploadToSFTP, downloadFromSFTP } = require('../utils/sftp');
const cloudinary = require('cloudinary').v2;
const sendEmail = require('../utils/email');

// Configure Cloudinary
if (process.env.STORAGE_TYPE === 'cloudinary') {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

// HELPER: Calculate effective permissions for a user on a document
const getEffectivePermissions = async (doc, user) => {
    const userId = user.id.toString();
    const isAdmin = user.role === 'Admin';
    const isEditor = user.role === 'Editor';
    const isViewer = user.role === 'Viewer';
    const uploaderId = (typeof doc.uploadedBy === 'object' && doc.uploadedBy !== null) 
        ? doc.uploadedBy._id.toString() 
        : doc.uploadedBy?.toString();
    const isOwner = uploaderId === userId;

    // BASE PERMISSIONS
    let canView = isOwner || isAdmin;
    let canDownload = isOwner || isAdmin;
    let canEdit = isOwner || isAdmin;
    let canShare = isOwner || isAdmin;
    let canDelete = isOwner || isAdmin;

    // IF SHARED DIRECTLY
    const isSharedDirectly = doc.sharedWith?.some(id => id.toString() === userId);
    if (isSharedDirectly) {
        canView = true;
        canDownload = doc.permissions?.canDownload !== false;
        // Direct sharing currently doesn't specify level, so we use doc.permissions
        canEdit = !isViewer && doc.permissions?.canEdit === true;
    }

    // IF SHARED VIA FOLDER (CASCADING)
    if (doc.folderId) {
        let currentFolderId = doc.folderId;
        while (currentFolderId) {
            const folder = await Folder.findById(currentFolderId);
            if (!folder) break;
            
            const folderShare = folder.sharedWith?.find(s => s.user.toString() === userId);
            if (folder.owner.toString() === userId || folderShare) {
                canView = true;
                canDownload = true;
                if (!isViewer && (folder.owner.toString() === userId || folderShare.access === 'edit')) {
                    canEdit = true;
                }
                break;
            }
            currentFolderId = folder.parentId;
        }
    }

    // ROLE OVERRIDES (Strict Gating)
    if (isViewer) {
        canEdit = false;
        canShare = false;
        canDelete = false;
    }

    // STATUS GATING
    if (doc.status === 'Approved') {
        canEdit = false; // Locked
    }

    return { canView, canDownload, canEdit, canShare, canDelete };
};

// HELPER: Handle versioning when uploading an existing file
const handleVersionUpdateFromUpload = async (req, res, document) => {
    try {
        const storageType = document.storageType || process.env.STORAGE_TYPE || 'mongodb';
        const currentVersionNumber = document.versions.length;
        
        // Archive current state
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

        const extension = path.extname(req.file.originalname).substring(1).toLowerCase() || 'others';
        const fileName = `v${newVersionNumber}-${Date.now()}-${req.file.originalname}`;

        if (storageType === 'local') {
            const storageDir = process.env.LOCAL_STORAGE_PATH || path.join(__dirname, '../uploads');
            const extDir = path.join(storageDir, extension);
            if (!fs.existsSync(extDir)) fs.mkdirSync(extDir, { recursive: true });
            fs.writeFileSync(path.join(extDir, fileName), req.file.buffer);
            document.storagePath = `${extension}/${fileName}`;
        } else if (storageType === 'sftp') {
            const remotePath = `${process.env.SFTP_BASE_PATH || '/uploads'}/${extension}/${fileName}`;
            await uploadToSFTP(req.file.buffer, remotePath);
            document.storagePath = remotePath;
        } else if (storageType === 'cloudinary') {
            const uploadPromise = new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { resource_type: 'raw', folder: 'docvault', public_id: `${Date.now()}-v${newVersionNumber}-${req.file.originalname}` },
                    (error, result) => { if (error) reject(error); else resolve(result); }
                );
                uploadStream.end(req.file.buffer);
            });
            const result = await uploadPromise;
            document.fileUrl = result.secure_url;
            document.storagePath = result.public_id;
        } else {
            document.fileData = req.file.buffer;
        }

        document.fileSize = req.file.size;
        document.updatedAt = Date.now();
        
        // Ensure main fileUrl is correct for Vercel/Proxy if not cloudinary
        if (storageType !== 'cloudinary') {
            document.fileUrl = `/api/documents/download/${document._id}?v=${Date.now()}`;
        }

        await document.save();
        res.json({ message: 'File updated to new version', document, version: newVersionNumber });
    } catch (err) {
        console.error('Helper Version Update Error:', err);
        res.status(500).json({ message: err.message });
    }
};

const uploadDocument = async (req, res) => {
    try {
        if (req.user.role === 'Viewer') {
            return res.status(403).json({ message: 'Viewers are not allowed to upload documents' });
        }
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const { title, tags, folderId } = req.body;

        const normalizedFolderId = (folderId === 'root' || !folderId) ? null : folderId;

        // SMART OVERWRITE DETECTION
        // If a file with same name exists in this folder for this user, treat as version update
        // We use Case-Insensitive regex for a better user experience
        const existingDoc = await Document.findOne({
            fileName: { $regex: new RegExp(`^${req.file.originalname.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') },
            folderId: normalizedFolderId,
            uploadedBy: req.user.id,
            isDeleted: false
        });

        if (existingDoc) {
            console.log(`[UPLOAD] Existing file found: ${existingDoc.fileName}. Updating to new version.`);
            return handleVersionUpdateFromUpload(req, res, existingDoc);
        }
        const storageType = process.env.STORAGE_TYPE || 'mongodb';
        console.log(`[STORAGE] Uploading document using storage type: ${storageType}`);
        const newDocument = new Document({
            title: title || req.file.originalname,
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            uploadedBy: req.user.id,
            folderId: normalizedFolderId,
            storageType,
            tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
            status: 'Draft',
            versions: [{
                versionNumber: 1,
                fileUrl: ''
            }]
        });

        const extension = path.extname(req.file.originalname).substring(1).toLowerCase() || 'others';
        const fileName = `${Date.now()}-${req.file.originalname}`;

        if (storageType === 'local') {
            const storageDir = process.env.LOCAL_STORAGE_PATH || path.join(__dirname, '../uploads');
            const extDir = path.join(storageDir, extension);
            
            // Create directory if it doesn't exist
            if (!fs.existsSync(extDir)) {
                fs.mkdirSync(extDir, { recursive: true });
            }

            const uploadPath = path.join(extDir, fileName);
            fs.writeFileSync(uploadPath, req.file.buffer);
            newDocument.storagePath = `${extension}/${fileName}`;
        } else if (storageType === 'sftp') {
            const remotePath = `${process.env.SFTP_BASE_PATH || '/uploads'}/${extension}/${fileName}`;
            await uploadToSFTP(req.file.buffer, remotePath);
            newDocument.storagePath = remotePath;
        } else if (storageType === 'cloudinary') {
            // Upload to Cloudinary using buffer
            const uploadPromise = new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { 
                        resource_type: 'raw',
                        folder: 'docvault',
                        public_id: `${Date.now()}-${req.file.originalname}`
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(req.file.buffer);
            });
            
            const result = await uploadPromise;
            newDocument.fileUrl = result.secure_url;
            newDocument.storagePath = result.public_id;
        } else {
            newDocument.fileData = req.file.buffer;
        }

        await newDocument.save();
        
        // Set fileUrl to the download endpoint if not already set by Cloudinary
        if (!newDocument.fileUrl) {
            newDocument.fileUrl = `/api/documents/download/${newDocument._id}`;
        }
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
        const { versionNumber } = req.params;
        let id = req.params.id;
        if (id && id.includes('.')) id = id.split('.')[0];

        let document = await Document.findById(id);
        if (!document) return res.status(404).json({ message: 'Document not found' });

        // If a specific version is requested
        let fileDataToRes = document.fileData;
        let fileNameToRes = document.fileName;
        let fileTypeToRes = document.fileType;
        let fileSizeToRes = document.fileSize;
        let storagePathToRes = document.storagePath;

        // Authorization/Permission Check
        const isOwner = document.uploadedBy.toString() === req.user.id.toString();
        const isAdmin = req.user.role === 'Admin';
        const isSharedDirectly = document.sharedWith?.some(id => id.toString() === req.user.id.toString());
        const isPublic = document.accessLevel === 'public';

        let isSharedViaFolder = false;
        if (document.folderId) {
            let currentFolderId = document.folderId;
            while (currentFolderId) {
                const folder = await Folder.findById(currentFolderId);
                if (!folder) break;
                if (folder.owner.toString() === req.user.id.toString() || 
                    folder.sharedWith.some(s => s.user.toString() === req.user.id.toString())) {
                    isSharedViaFolder = true;
                    break;
                }
                currentFolderId = folder.parentId;
            }
        }

        if (!isOwner && !isAdmin && !isSharedDirectly && !isSharedViaFolder && !isPublic) {
            return res.status(401).json({ message: 'Not authorized to access this document' });
        }

        if (versionNumber) {
            const version = document.versions.find(v => v.versionNumber.toString() === versionNumber.toString());
            if (!version) return res.status(404).json({ message: 'Version not found' });
            
            if (version.fileUrl) return res.redirect(version.fileUrl);
            if (version.fileData) fileDataToRes = version.fileData;
            if (version.storagePath) storagePathToRes = version.storagePath;
        }

        res.set({
            'Content-Type': fileTypeToRes,
            'Content-Disposition': `attachment; filename="${fileNameToRes || 'download'}"`,
        });

        if (document.storageType === 'local' && storagePathToRes) {
            const storageDir = process.env.LOCAL_STORAGE_PATH || path.join(__dirname, '../uploads');
            const filePath = path.join(storageDir, storagePathToRes);
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                res.set('Content-Length', stats.size);
                return fs.createReadStream(filePath).pipe(res);
            }
        } else if (document.storageType === 'sftp' && storagePathToRes) {
            try {
                const data = await downloadFromSFTP(storagePathToRes);
                res.set('Content-Length', data.length);
                return res.send(data);
            } catch (sftpErr) {
                console.error('SFTP Download Error:', sftpErr);
                // Fallback to memory data if available
            }
        } else if (document.storageType === 'cloudinary') {
            return res.redirect(document.fileUrl);
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
        const { tab, search, folderId } = req.query;
        let query = { isDeleted: false };
        
        // Handle folder filter
        if (folderId) {
            query.folderId = folderId === 'root' ? null : folderId;
        }

        switch (tab) {
            case 'Sharing':
            case 'Shared with Me':
                query.sharedWith = req.user.id;
                query.isDeleted = false;
                break;
            case 'Starred':
                query.uploadedBy = req.user.id;
                query.isStarred = true;
                query.isDeleted = false;
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
                query.isDeleted = false;
                break;
            default:
                query.isDeleted = false;
                if (!folderId) {
                    // In root view, show only docs in root
                    query.folderId = null;
                }
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
        
        // Calculate effective permissions for each document
        const docsWithPermissions = await Promise.all(documents.map(async (doc) => {
            const permissions = await getEffectivePermissions(doc, req.user);
            return { ...doc.toObject(), userPermissions: permissions };
        }));

        res.json(docsWithPermissions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const syncLocalFiles = async (req, res) => {
    try {
        if (process.env.STORAGE_TYPE !== 'local') {
            return res.status(400).json({ message: 'Sync is only available for local storage' });
        }

        const storageDir = process.env.LOCAL_STORAGE_PATH || path.join(__dirname, '../uploads');
        console.log('Syncing from directory:', storageDir);
        
        if (!fs.existsSync(storageDir)) {
            console.log('Directory does not exist. Creating it.');
            fs.mkdirSync(storageDir, { recursive: true });
            return res.json({ message: 'Storage directory created. No files to sync.', count: 0 });
        }

        const files = fs.readdirSync(storageDir);
        console.log('Files found in storage directory:', files);
        let syncCount = 0;

        for (const file of files) {
            console.log(`Checking file: ${file}`);
            // Basic check to see if file is already in DB
            const existing = await Document.findOne({ 
                storagePath: file,
                storageType: 'local'
            });

            if (!existing) {
                console.log(`New file detected: ${file}. Adding to database...`);
                const filePath = path.join(storageDir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.isFile()) {
                    const ext = path.extname(file).toLowerCase();
                    let fileType = 'application/octet-stream';
                    if (ext === '.docx') fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    else if (ext === '.pdf') fileType = 'application/pdf';
                    else if (ext === '.txt') fileType = 'text/plain';

                    const newDoc = new Document({
                        title: file,
                        fileName: file,
                        fileType: fileType,
                        fileSize: stats.size,
                        uploadedBy: req.user.id,
                        storageType: 'local',
                        storagePath: file,
                        versions: [{
                            versionNumber: 1,
                            fileUrl: `/api/documents/download/local/${file}`,
                        }]
                    });

                    // Set initial URL
                    newDoc.fileUrl = `/api/documents/download/${newDoc._id}`;
                    newDoc.versions[0].fileUrl = newDoc.fileUrl;
                    
                    await newDoc.save();
                    syncCount++;
                }
            }
        }

        res.json({ message: `Sync complete. ${syncCount} new files added.`, count: syncCount });
    } catch (err) {
        console.error('Sync Error:', err);
        res.status(500).json({ message: err.message });
    }
};

const deleteDocument = async (req, res) => {
    try {
        let id = req.params.id;
        if (id && id.includes('.')) id = id.split('.')[0];
        const document = await Document.findById(id);
        if (!document) return res.status(404).json({ message: 'Document not found' });
        
        const isAdmin = req.user.role === 'Admin';
        const isOwner = document.uploadedBy.toString() === req.user.id.toString();

        if (!isOwner && !isAdmin) {
            return res.status(401).json({ message: 'Not authorized. Only owners or admins can delete documents.' });
        }
        
        
        if (req.user.role === 'Viewer') {
            return res.status(403).json({ message: 'Viewers are not allowed to delete documents' });
        }

        if (document.isDeleted) {
            // If on Cloudinary, delete from Cloudinary too
            if (document.storageType === 'cloudinary' && document.storagePath) {
                try {
                    // For Word/Excel/PDF, resource_type must be 'raw' to delete correctly
                    await cloudinary.uploader.destroy(document.storagePath, { resource_type: 'raw' });
                } catch (cloudErr) {
                    console.error('Cloudinary Delete Error:', cloudErr);
                }
            }
            await Document.findByIdAndDelete(id);
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
        let id = req.params.id;
        if (id && id.includes('.')) id = id.split('.')[0];
        const document = await Document.findById(id);
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

        let id = req.params.id;
        if (id && id.includes('.')) id = id.split('.')[0];
        const document = await Document.findById(id);
        if (!document) return res.status(404).json({ message: 'Document not found' });

        // Add to sharedWith if not already there
        if (!document.sharedWith) document.sharedWith = [];
        if (!document.sharedWith.includes(targetUser._id)) {
            document.sharedWith.push(targetUser._id);
            await document.save();

            // Send Email Notification
            await sendEmail({
                email: targetUser.email,
                subject: 'DocVault - A document has been shared with you',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #0284c7;">Document Shared</h2>
                        <p>Hello <b>${targetUser.name}</b>,</p>
                        <p><b>${req.user.name}</b> has shared a document with you: <b style="color: #0284c7;">${document.title}</b>.</p>
                        <p>You can view this document in your "Shared with Me" tab under the dashboard.</p>
                        <p><a href="${process.env.VITE_APP_URL || '#'}/dashboard" style="display: inline-block; padding: 10px 20px; background: #0284c7; color: white; text-decoration: none; border-radius: 5px;">View Document</a></p>
                        <br/>
                        <p>Best regards,<br/>DocVault Team</p>
                    </div>
                `
            });
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
        let id = req.params.id;
        if (id && id.includes('.')) id = id.split('.')[0];
        const document = await Document.findById(id);
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
        const { versionNumber } = req.params;
        let id = req.params.id;
        if (id && id.includes('.')) id = id.split('.')[0];
        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        
        let fileTypeToRes = document.fileType;
        let storagePathToRes = document.storagePath;
        let fileNameToRes = document.fileName;

        if (versionNumber) {
            const version = document.versions.find(v => v.versionNumber.toString() === versionNumber.toString());
            if (!version) return res.status(404).json({ message: 'Version not found' });
            if (version.storagePath) storagePathToRes = version.storagePath;
        }

        const isOwner = document.uploadedBy.toString() === req.user.id.toString();
        const isAdmin = req.user.role === 'Admin';
        const isSharedDirectly = document.sharedWith?.some(id => id.toString() === req.user.id.toString());
        const isPublic = document.accessLevel === 'public';

        let isSharedViaFolder = false;
        if (document.folderId) {
            let currentFolderId = document.folderId;
            while (currentFolderId) {
                const folder = await Folder.findById(currentFolderId);
                if (!folder) break;
                if (folder.owner.toString() === req.user.id.toString() || 
                    folder.sharedWith.some(s => s.user.toString() === req.user.id.toString())) {
                    isSharedViaFolder = true;
                    break;
                }
                currentFolderId = folder.parentId;
            }
        }

        if (!isOwner && !isAdmin && !isSharedDirectly && !isSharedViaFolder && !isPublic) {
            return res.status(401).json({ message: 'Not authorized to access this document' });
        }
        
        res.set({
            'Content-Type': fileTypeToRes,
            'Content-Disposition': `inline; filename="${fileNameToRes || 'view'}"`,
        });

        if (document.storageType === 'local' && storagePathToRes) {
            const storageDir = process.env.LOCAL_STORAGE_PATH || path.join(__dirname, '../uploads');
            const filePath = path.join(storageDir, storagePathToRes);
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                res.set('Content-Length', stats.size);
                return fs.createReadStream(filePath).pipe(res);
            }
        } else if (document.storageType === 'sftp' && storagePathToRes) {
            try {
                const data = await downloadFromSFTP(storagePathToRes);
                res.set('Content-Length', data.length);
                return res.send(data);
            } catch (sftpErr) {
                console.error('SFTP View Error:', sftpErr);
            }
        } else if (document.storageType === 'cloudinary') {
            return res.redirect(document.fileUrl);
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
        let id = req.params.id;
        if (id && id.includes('.')) id = id.split('.')[0];
        const document = await Document.findById(id);
        if (!document) return res.status(404).json({ message: 'Document not found' });

        const effectivePerms = await getEffectivePermissions(document, req.user);

        if (!effectivePerms.canEdit) {
            return res.status(403).json({ message: 'No permission to edit metadata or document is locked/you are a Viewer' });
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
        const { htmlContent, type } = req.body; 
        
        console.log(`[EDITOR] Update Version Trace for ${id}:`, { 
            type, 
            hasHtml: !!htmlContent, 
            hasFile: !!req.file,
            contentType: req.headers['content-type']
        });

        const document = await Document.findById(id);
        if (!document) return res.status(404).json({ message: 'Document not found' });

        const effectivePerms = await getEffectivePermissions(document, req.user);

        if (!effectivePerms.canEdit) {
            return res.status(403).json({ message: 'No permission to edit content or document is locked/you are a Viewer' });
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
                
                const storageType = document.storageType || process.env.STORAGE_TYPE || 'mongodb';
                console.log(`[EDITOR] Saving new ${type} version using ${storageType}`);

                const extension = type || path.extname(document.fileName).substring(1).toLowerCase() || 'others';
                const newFileName = `v${newVersionNumber}_${document.fileName}`;

                if (storageType === 'local') {
                    const storageDir = process.env.LOCAL_STORAGE_PATH || path.join(__dirname, '../uploads');
                    const extDir = path.join(storageDir, extension);
                    if (!fs.existsSync(extDir)) fs.mkdirSync(extDir, { recursive: true });
                    const filePath = path.join(extDir, newFileName);
                    fs.writeFileSync(filePath, docxBuffer);
                    document.storagePath = `${extension}/${newFileName}`;
                } else if (storageType === 'sftp') {
                    const remotePath = `${process.env.SFTP_BASE_PATH || '/uploads'}/${extension}/${newFileName}`;
                    await uploadToSFTP(docxBuffer, remotePath);
                    document.storagePath = remotePath;
                } else if (storageType === 'cloudinary') {
                    const uploadPromise = new Promise((resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream(
                            { 
                                resource_type: 'raw',
                                folder: 'docvault',
                                public_id: `${Date.now()}-v${newVersionNumber}-${document.fileName}`
                            },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve(result);
                            }
                        );
                        uploadStream.end(docxBuffer);
                    });
                    
                    const result = await uploadPromise;
                    document.fileUrl = result.secure_url;
                    document.storagePath = result.public_id;
                } else {
                    document.fileData = docxBuffer;
                }
                document.fileSize = docxBuffer.length;
            } catch (convErr) {
                console.error('Word Conversion Error:', convErr);
                return res.status(400).json({ message: `Word Conversion Error: ${convErr.message}` });
            }
        } else if (req.file) {
            // If it's a PDF or direct file upload from editor
            const extension = path.extname(req.file.originalname).substring(1).toLowerCase() || 'others';
            const newFileName = `v${newVersionNumber}_${req.file.originalname}`;

            if (document.storageType === 'local') {
                const storageDir = process.env.LOCAL_STORAGE_PATH || path.join(__dirname, '../uploads');
                const extDir = path.join(storageDir, extension);
                if (!fs.existsSync(extDir)) fs.mkdirSync(extDir, { recursive: true });
                const filePath = path.join(extDir, newFileName);
                fs.writeFileSync(filePath, req.file.buffer);
                document.storagePath = `${extension}/${newFileName}`;
            } else if (document.storageType === 'sftp') {
                const remotePath = `${process.env.SFTP_BASE_PATH || '/uploads'}/${extension}/${newFileName}`;
                await uploadToSFTP(req.file.buffer, remotePath);
                document.storagePath = remotePath;
            } else if (document.storageType === 'cloudinary') {
                const uploadPromise = new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { 
                            resource_type: 'raw',
                            folder: 'docvault',
                            public_id: `${Date.now()}-v${newVersionNumber}-${req.file.originalname}`
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    uploadStream.end(req.file.buffer);
                });
                
                const result = await uploadPromise;
                document.fileUrl = result.secure_url;
                document.storagePath = result.public_id;
            } else {
                document.fileData = req.file.buffer;
            }
            document.fileSize = req.file.size;
            document.fileType = req.file.mimetype;
            document.fileName = req.file.originalname;
        } else {
            return res.status(400).json({ 
                message: 'No content or file provided for update',
                received: { type, hasHtml: !!htmlContent, hasFile: !!req.file }
            });
        }

        document.updatedAt = Date.now();
        await document.save();

        res.json({ message: 'Document version updated', version: document.versions.length });
    } catch (err) {
        console.error('Update Version Error:', err);
        res.status(500).json({ message: err.message });
    }
};

const openInDesktop = async (req, res) => {
    try {
        let id = req.params.id;
        if (id && id.includes('.')) id = id.split('.')[0];
        const document = await Document.findById(id);
        if (!document) return res.status(404).json({ message: 'Document not found' });

        // Protocol URI mapping
        const protocolMap = {
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'ms-word',
            'application/msword': 'ms-word',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'ms-excel',
            'application/vnd.ms-excel': 'ms-excel',
            'text/csv': 'ms-excel',
            'application/csv': 'ms-excel',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'ms-powerpoint',
            'application/vnd.ms-powerpoint': 'ms-powerpoint',
            'text/plain': 'ms-word'
        };

        const protocol = protocolMap[document.fileType];
        
        // If it's a local development environment and storage is local, we can still try 'start'
        if (process.env.NODE_ENV !== 'production' && document.storageType === 'local') {
            const storageDir = process.env.LOCAL_STORAGE_PATH || path.join(__dirname, '../uploads');
            const filePath = path.join(storageDir, document.storagePath);

            if (fs.existsSync(filePath)) {
                console.log(`Launching Desktop App for: ${filePath}`);
                require('child_process').exec(`start "" "${filePath}"`);
                return res.json({ message: 'Opening in Desktop Application...', mode: 'local' });
            }
        }

        // Production / Universal Fallback: Use Protocol URI
        if (!protocol) {
            return res.status(400).json({ message: 'Desktop editing is only available for Office documents (Word, Excel, PowerPoint).' });
        }

        // Construct the full URL for the document
        const host = req.get('host');
        const protocolPrefix = req.protocol;
        const token = req.header('x-auth-token') || req.query.token;
        
        // Define a mapping for extensions
        const extMap = {
            'ms-word': document.fileName.endsWith('.doc') ? 'file.doc' : 'file.docx',
            'ms-excel': document.fileName.endsWith('.csv') ? 'file.csv' : (document.fileName.endsWith('.xls') ? 'file.xls' : 'file.xlsx'),
            'ms-powerpoint': document.fileName.endsWith('.ppt') ? 'file.ppt' : 'file.pptx'
        };
        const extension = extMap[protocol] || 'file.docx';

        // URL format for WebDAV: /api/documents/dav/:id/:token/:filename
        const fileUrl = `${protocolPrefix}://${host}/api/documents/dav/${document._id}/${token}/${document.fileName.replace(/\s+/g, '_')}`;
        
        // Final Office URI: protocol:ofe|u|url
        const officeUri = `${protocol}:ofe|u|${fileUrl}`;

        res.json({ 
            message: 'Redirecting to Desktop Application...', 
            mode: 'protocol',
            uri: officeUri 
        });
    } catch (err) {
        console.error('Open Desktop Error:', err);
        res.status(500).json({ message: err.message });
    }
};

const getPublicDocument = async (req, res) => {
    try {
        let id = req.params.id;
        if (id && id.includes('.')) id = id.split('.')[0];
        const { accessKey } = req.query;
        
        const secret = process.env.JWT_SECRET || 'fallback_secret';
        const expectedKey = crypto.createHmac('sha256', secret).update(id).digest('hex');
        
        if (accessKey !== expectedKey) {
            return res.status(401).json({ message: 'Invalid or expired access key' });
        }

        const document = await Document.findById(id);
        if (!document) return res.status(404).json({ message: 'Document not found' });

        let fileDataToRes = document.fileData;
        let fileNameToRes = document.fileName;
        let fileTypeToRes = document.fileType;
        let storagePathToRes = document.storagePath;

        res.set({
            'Content-Type': fileTypeToRes,
            'Content-Disposition': `inline; filename="${fileNameToRes || 'view'}"`,
            'Access-Control-Allow-Origin': '*'
        });

        if (document.storageType === 'local' && storagePathToRes) {
            const storageDir = process.env.LOCAL_STORAGE_PATH || path.join(__dirname, '../uploads');
            const filePath = path.join(storageDir, storagePathToRes);
            if (fs.existsSync(filePath)) {
                return fs.createReadStream(filePath).pipe(res);
            }
        } else if (document.storageType === 'sftp' && storagePathToRes) {
            try {
                const data = await downloadFromSFTP(storagePathToRes);
                return res.send(data);
            } catch (sftpErr) {
                console.error('SFTP Public View Error:', sftpErr);
            }
        }
        
        if (!fileDataToRes) return res.status(404).json({ message: 'File data not found' });
        res.send(fileDataToRes);
    } catch (err) {
        console.error('Public Bridge Error:', err);
        res.status(500).json({ message: err.message });
    }
};

const updateDocumentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const id = req.params.id;
        
        const document = await Document.findById(id).populate('uploadedBy', 'name email');
        if (!document) return res.status(404).json({ message: 'Document not found' });

        // Permission check
        const isAdmin = req.user.role === 'Admin';
        const isOwner = document.uploadedBy._id.toString() === req.user.id;
        if (!isAdmin && status === 'Approved') {
            return res.status(403).json({ message: 'Only admins can approve documents' });
        }

        document.status = status;
        document.updatedAt = Date.now();
        await document.save();

        // Notify user if status changed to Approved or Pending Review
        if (status === 'Approved' || status === 'Pending Review') {
            try {
                await sendEmail({
                    email: document.uploadedBy.email,
                    subject: `DocVault - Document Status Updated: ${status}`,
                    html: `<p>Hello ${document.uploadedBy.name},</p>
                           <p>The status of your document <b>${document.title}</b> has been updated to <b>${status}</b>.</p>`
                });
            } catch (err) { console.error('Notify error:', err); }
        }

        res.json({ message: 'Status updated successfully', document });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getAnnotations = async (req, res) => {
    try {
        const annotations = await Comment.find({ documentId: req.params.id })
            .populate('author', 'name avatar')
            .sort({ createdAt: 1 });
        res.json(annotations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const addAnnotation = async (req, res) => {
    try {
        const { text, position, type } = req.body;
        const newAnnotation = new Comment({
            documentId: req.params.id,
            author: req.user.id,
            text,
            position,
            type
        });
        await newAnnotation.save();
        const populated = await newAnnotation.populate('author', 'name avatar');
        
        // Broadcast via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.to(req.params.id).emit('annotation_added', populated);
        }

        res.status(201).json(populated);
    } catch (err) {
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
    updateDocumentStatus,
    getAnnotations,
    addAnnotation,
    syncLocalFiles,
    openInDesktop,
    getPublicDocument
};
