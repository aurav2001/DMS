const Folder = require('../models/Folder');
const Document = require('../models/Document');
const User = require('../models/User');
const sendEmail = require('../utils/email');

// Create a new folder
exports.createFolder = async (req, res) => {
    try {
        const { name, parentId } = req.body;
        const folder = new Folder({
            name,
            parentId: parentId || null,
            owner: req.user.id
        });
        await folder.save();
        res.status(201).json(folder);
    } catch (err) {
        res.status(500).json({ message: 'Error creating folder', error: err.message });
    }
};

// Get contents of a folder (Subfolders + Documents)
exports.getFolderContents = async (req, res) => {
    try {
        const parentId = req.params.folderId === 'root' ? null : req.params.folderId;
        const userId = req.user.id;

        let hasAccessToParent = false;
        if (!parentId) {
            hasAccessToParent = true; // Root is always accessible (filtered below)
        } else {
            // Check if user is owner or shared on this specific folder or ANY parent folder
            let currentId = parentId;
            while (currentId) {
                const folder = await Folder.findById(currentId);
                if (!folder) break;
                if (folder.owner.toString() === userId.toString() || 
                    folder.sharedWith.some(s => s.user.toString() === userId.toString())) {
                    hasAccessToParent = true;
                    break;
                }
                currentId = folder.parentId;
            }
        }

        let folderQuery = { parentId, isDeleted: false };
        let docQuery = { folderId: parentId, isDeleted: false };

        if (!hasAccessToParent) {
            return res.status(403).json({ message: 'Access denied to this folder' });
        }

        // If at root, we must filter items that are specifically owned/shared
        if (!parentId) {
            folderQuery.$or = [
                { owner: userId },
                { 'sharedWith.user': userId }
            ];
            docQuery.$or = [
                { uploadedBy: userId },
                { sharedWith: userId }
            ];
        } 
        // If inside an accessible folder, we show everything (cascading)
        // Note: For root view, the logic above ensures only top-level shared items appear.

        const folders = await Folder.find(folderQuery);
        const documents = await Document.find(docQuery).populate('uploadedBy', 'name email avatar');

        // Helper to calculate effective permissions for a document
        const getDocPermissions = async (doc, user) => {
            const userId = user.id.toString();
            const isAdmin = user.role === 'Admin';
            const isViewer = user.role === 'Viewer';
            const uploaderId = doc.uploadedBy?._id?.toString() || doc.uploadedBy?.toString();
            const isOwner = uploaderId === userId;

            let canView = isOwner || isAdmin;
            let canDownload = isOwner || isAdmin;
            let canEdit = isOwner || isAdmin;
            let canShare = isOwner || isAdmin;

            // Inherit from parent folders
            if (doc.folderId) {
                let currentId = doc.folderId;
                while (currentId) {
                    const f = await Folder.findById(currentId);
                    if (!f) break;
                    const share = f.sharedWith?.find(s => s.user.toString() === userId);
                    if (f.owner.toString() === userId || share) {
                        canView = true;
                        canDownload = true;
                        if (!isViewer && (f.owner.toString() === userId || share.access === 'edit')) canEdit = true;
                        break;
                    }
                    currentId = f.parentId;
                }
            }

            // Direct share
            if (doc.sharedWith?.some(id => id.toString() === userId)) {
                canView = true;
                canDownload = true;
                if (!isViewer && doc.permissions?.canEdit) canEdit = true;
            }

            if (isViewer) {
                canEdit = false;
                canShare = false;
            }

            if (doc.status === 'Approved') canEdit = false;

            return { canView, canDownload, canEdit, canShare };
        };

        const docsWithPerms = await Promise.all(documents.map(async (doc) => {
            const perms = await getDocPermissions(doc, req.user);
            return { ...doc.toObject(), userPermissions: perms };
        }));

        res.json({ folders, documents: docsWithPerms });
    } catch (err) {
        console.error('[GetFolderContents Error]', err);
        res.status(500).json({ message: 'Error fetching contents', error: err.message });
    }

};

// Share a folder
exports.shareFolder = async (req, res) => {
    try {
        const { email, access } = req.body; // access: 'view' or 'edit'
        const userToShare = await User.findOne({ email });

        if (!userToShare) {
            return res.status(404).json({ message: 'User not found' });
        }

        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).json({ message: 'Folder not found' });

        // Add to sharedWith if not already there
        const existingShare = folder.sharedWith.find(s => s.user.toString() === userToShare._id.toString());
        if (existingShare) {
            existingShare.access = access;
        } else {
            folder.sharedWith.push({ user: userToShare._id, access });
        }

        await folder.save();

        // Send Email Notification
        await sendEmail({
            email: userToShare.email,
            subject: `DocVault - A folder has been shared with you`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">Folder Shared</h2>
                    <p>Hello <b>${userToShare.name}</b>,</p>
                    <p><b>${req.user.name}</b> has shared a folder with you: <b style="color: #6366f1;">${folder.name}</b>.</p>
                    <p>Access Level: <span style="background: #eef2ff; color: #6366f1; padding: 2px 8px; rounded: 4px; font-weight: bold;">${access.toUpperCase()}</span></p>
                    <p>You can view this folder and its contents in your "Shared with Me" tab under the dashboard.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.VITE_APP_URL || '#'}/dashboard" style="display: inline-block; padding: 12px 25px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">View Folder</a>
                    </div>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #94a3b8; text-align: center;">This is an automated message from DocVault.<br/>Please do not reply to this email.</p>
                </div>
            `
        });

        res.json({ message: `Folder shared with ${email} as ${access}`, folder });
    } catch (err) {
        res.status(500).json({ message: 'Error sharing folder', error: err.message });
    }
};

// Delete a folder (Soft delete)
exports.deleteFolder = async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).json({ message: 'Folder not found' });

        folder.isDeleted = true;
        await folder.save();

        // Also soft-delete all documents inside (basic implementation, not recursive for nested folders yet)
        await Document.updateMany({ folderId: folder._id }, { isDeleted: true });

        res.json({ message: 'Folder and its immediate contents moved to trash' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting folder', error: err.message });
    }
};

// Get breadcrumbs for a folder
exports.getBreadcrumbs = async (req, res) => {
    try {
        let currentId = req.params.id;
        const crumbs = [];
        
        while (currentId) {
            const folder = await Folder.findById(currentId).select('name parentId');
            if (!folder) break;
            crumbs.unshift(folder);
            currentId = folder.parentId;
        }
        
        res.json(crumbs);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching breadcrumbs' });
    }
};
