const Folder = require('../models/Folder');
const Document = require('../models/Document');
const User = require('../models/User');
const sendEmail = require('../utils/email');

// Helper to determine effective access level for a folder
const getFolderAccess = async (folderId, userId, userRole) => {
    if (userRole === 'Admin') return 'edit';
    const uid = userId.toString();
    
    let currentId = folderId;
    while (currentId) {
        const folder = await Folder.findById(currentId);
        if (!folder) break;
        
        if (folder.owner.toString() === uid) return 'edit';
        
        const share = folder.sharedWith.find(s => s.user.toString() === uid);
        if (share) return share.access; // 'view', 'edit', or 'none'
        
        currentId = folder.parentId;
    }
    return 'none';
};
// Helper to calculate effective permissions for a document
const getDocPermissions = async (doc, user, pAccess) => {
    const userId = user.id.toString();
    const isAdmin = user.role === 'Admin';
    const isViewer = user.role === 'Viewer';
    const uploaderId = doc.uploadedBy?._id?.toString() || doc.uploadedBy?.toString();
    const isOwner = uploaderId === userId;

    // Direct share on document
    const directShare = doc.sharedWith?.some(id => id.toString() === userId);

    // Initial permissions based on ownership/role
    let canView = isOwner || isAdmin || directShare;
    let canDownload = isOwner || isAdmin || directShare;
    let canEdit = isOwner || isAdmin;
    let canShare = isOwner || isAdmin;

    // Folder Inheritance (Crucial for bulk permissions)
    if (pAccess === 'edit') {
        canView = true;
        canDownload = true;
        canEdit = true; // If folder is editable, all files inside are editable
    } else if (pAccess === 'view') {
        canView = true;
        canDownload = true;
        // canEdit remains based on owner/admin or directShare check below
    } else if (pAccess === 'none') {
        // If folder is hidden and user is NOT owner/admin/directShare, they lose access
        if (!isOwner && !isAdmin && !directShare) {
            return { canView: false, canDownload: false, canEdit: false, canShare: false };
        }
    }

    // Direct document-level share override
    if (directShare && doc.permissions?.canEdit) {
        canEdit = true;
    }

    // Final safety overrides (Role and Status)
    if (isViewer) {
        canEdit = false; // Viewers can NEVER edit
        canShare = false;
    }

    if (doc.status === 'Approved') {
        canEdit = false; // Approved documents cannot be edited
    }

    return { canView, canDownload, canEdit, canShare };
};


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
        const userRole = req.user.role;

        // 1. Check access to the requested folder
        let parentAccess = 'none';
        if (!parentId) {
            parentAccess = 'edit'; // Root is accessible, but we filter children
        } else {
            parentAccess = await getFolderAccess(parentId, userId, userRole);
        }

        if (parentAccess === 'none') {
            return res.status(403).json({ message: 'Access denied to this folder' });
        }

        const { tab, search } = req.query;
        let queryFolders = { isDeleted: false };
        let queryDocs = { isDeleted: false };

        // --- TAB FILTERING LOGIC ---
        if (tab === 'Starred') {
            queryFolders = null;
            queryDocs.isStarred = true;
        } else if (tab === 'Sharing') {
            if (!parentId) {
                // Global Sharing: Show ONLY items directly shared with me at root
                queryFolders = { 'sharedWith.user': userId, isDeleted: false };
                queryDocs = { sharedWith: userId, isDeleted: false };
            } else {
                // Navigation inside a Shared Folder: Act like normal navigation
                queryFolders.parentId = parentId;
                queryDocs.folderId = parentId;
            }
        } else if (tab === 'Recent') {
            queryFolders = null;
            queryDocs.$or = [{ uploadedBy: userId }, { sharedWith: userId }];
            queryDocs.isDeleted = false;
        } else if (tab === 'Trash') {
            queryFolders = { owner: userId, isDeleted: true };
            queryDocs = { uploadedBy: userId, isDeleted: true };
        } else {
            // Default: My Documents
            queryFolders.parentId = parentId;
            queryDocs.folderId = parentId;
            
            if (!parentId) {
                queryFolders.owner = userId;
                queryDocs.uploadedBy = userId;
            }
        }

        // --- FETCHING ---
        let allFolders = [];
        let allDocuments = [];

        if (queryFolders) {
            allFolders = await Folder.find(queryFolders);
        }

        if (queryDocs) {
            let docsQuery = Document.find(queryDocs).populate('uploadedBy', 'name email avatar');
            if (tab === 'Recent') {
                docsQuery = docsQuery.sort({ updatedAt: -1 }).limit(20);
            }
            allDocuments = await docsQuery;
        }

        // --- SEARCH FILTERING (If search query exists) ---
        if (search) {
            const regex = new RegExp(search, 'i');
            allFolders = allFolders.filter(f => regex.test(f.name));
            allDocuments = allDocuments.filter(d => regex.test(d.title));
        }

        // --- PERMISSION ANNOTATION ---
        const accessibleFolders = [];
        for (const f of allFolders) {
            let access = 'none';
            if (userRole === 'Admin' || f.owner.toString() === userId.toString()) {
                access = 'edit';
            } else {
                const share = f.sharedWith.find(s => s.user.toString() === userId.toString());
                if (share) access = share.access;
                else if (parentId) access = parentAccess; // Inherit if navigating
            }

            if (access !== 'none' || tab === 'Sharing') {
                accessibleFolders.push({ ...f.toObject(), userAccess: access });
            }
        }

        const docsWithPerms = [];
        for (const doc of allDocuments) {
            const perms = await getDocPermissions(doc, req.user, parentAccess);
            if (perms.canView || tab === 'Sharing' || tab === 'Starred' || tab === 'Trash') {
                docsWithPerms.push({ ...doc.toObject(), userPermissions: perms });
            }
        }

        res.json({ folders: accessibleFolders, documents: docsWithPerms });
    } catch (err) {
        console.error('[GetFolderContents Error]', err);
        res.status(500).json({ message: 'Error fetching contents', error: err.message });
    }
};

// Share a folder
exports.shareFolder = async (req, res) => {
    try {
        const { email, access } = req.body; // access: 'view', 'edit', or 'none'
        const userToShare = await User.findOne({ email });

        if (!userToShare) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userToShare._id.toString() === req.user.id.toString()) {
            return res.status(400).json({ message: 'You cannot share a folder with yourself' });
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

// Share folder and subfolders in bulk
exports.shareFolderBulk = async (req, res) => {
    try {
        const { email, parentAccess, subfolderOverrides } = req.body;
        const userToShare = await User.findOne({ email });

        if (!userToShare) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userToShare._id.toString() === req.user.id.toString()) {
            return res.status(400).json({ message: 'You cannot share a folder with yourself' });
        }

        const parentFolder = await Folder.findById(req.params.id);
        if (!parentFolder) return res.status(404).json({ message: 'Parent folder not found' });

        // 1. Update Parent
        const existingShare = parentFolder.sharedWith.find(s => s.user.toString() === userToShare._id.toString());
        if (existingShare) existingShare.access = parentAccess;
        else parentFolder.sharedWith.push({ user: userToShare._id, access: parentAccess });
        await parentFolder.save();

        // 2. Update Subfolders
        if (subfolderOverrides && subfolderOverrides.length > 0) {
            for (const override of subfolderOverrides) {
                const subFolder = await Folder.findById(override.folderId);
                if (subFolder) {
                    const existingSubShare = subFolder.sharedWith.find(s => s.user.toString() === userToShare._id.toString());
                    if (existingSubShare) existingSubShare.access = override.access;
                    else subFolder.sharedWith.push({ user: userToShare._id, access: override.access });
                    await subFolder.save();
                }
            }
        }

        res.json({ message: `Bulk sharing completed for ${email}`, folder: parentFolder });
    } catch (err) {
        res.status(500).json({ message: 'Error in bulk sharing', error: err.message });
    }
};

// Get immediate subfolders for permission management
exports.getSubfolders = async (req, res) => {
    try {
        const folders = await Folder.find({ 
            parentId: req.params.id, 
            isDeleted: false 
        }).select('name _id sharedWith');
        res.json(folders);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching subfolders' });
    }
};

// Delete a folder (Soft delete for owner, remove share for others)
exports.deleteFolder = async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).json({ message: 'Folder not found' });

        const userId = req.user.id.toString();
        const isOwner = folder.owner.toString() === userId;
        const isAdmin = req.user.role === 'Admin';

        if (isOwner || isAdmin) {
            // Owner deletes for everyone
            folder.isDeleted = true;
            await folder.save();
            await Document.updateMany({ folderId: folder._id }, { isDeleted: true });
            res.json({ message: 'Folder and its immediate contents moved to trash' });
        } else {
            // Shared user just removes their own access
            const shareIndex = folder.sharedWith.findIndex(s => s.user.toString() === userId);
            if (shareIndex > -1) {
                folder.sharedWith.splice(shareIndex, 1);
                await folder.save();
                res.json({ message: 'Folder removed from your view' });
            } else {
                res.status(403).json({ message: 'Not authorized to delete this folder' });
            }
        }
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
