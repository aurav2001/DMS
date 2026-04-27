const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createFolder,
    getFolderContents,
    shareFolder,
    deleteFolder,
    getBreadcrumbs,
    getSubfolders,
    shareFolderBulk
} = require('../controllers/folders');

router.post('/', auth, createFolder);
router.get('/contents/:folderId', auth, getFolderContents);
router.get('/:id/subfolders', auth, getSubfolders);
router.post('/:id/share', auth, shareFolder);
router.post('/:id/share-bulk', auth, shareFolderBulk);
router.delete('/:id', auth, deleteFolder);
router.get('/:id/breadcrumbs', auth, getBreadcrumbs);

module.exports = router;
