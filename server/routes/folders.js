const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createFolder,
    getFolderContents,
    shareFolder,
    deleteFolder,
    getBreadcrumbs
} = require('../controllers/folders');

router.post('/', auth, createFolder);
router.get('/contents/:folderId', auth, getFolderContents);
router.post('/:id/share', auth, shareFolder);
router.delete('/:id', auth, deleteFolder);
router.get('/:id/breadcrumbs', auth, getBreadcrumbs);

module.exports = router;
