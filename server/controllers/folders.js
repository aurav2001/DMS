const Folder = require('../models/Folder');
const Document = require('../models/Document');
const User = require('../models/User');

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

        res.json({ folders, documents });
    } catch (err) {
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
