const express = require('express');
const { 
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
} = require('../controllers/documents');
const auth = require('../middleware/auth');
const upload = require('../middleware/multer');
const router = express.Router();

router.post('/upload', auth, upload.single('file'), uploadDocument);
router.get('/', auth, getDocuments);
router.get('/download/:id', auth, downloadDocument);
router.get('/view/:id', auth, viewDocument);
router.delete('/:id', auth, deleteDocument);
router.patch('/:id/star', auth, toggleStar);
router.post('/:id/share', auth, shareDocument);
router.post('/:id/unshare', auth, unshareDocument);
router.patch('/:id', auth, updateDocumentMetadata);
router.post('/:id/version', auth, upload.single('file'), updateDocumentVersion);

module.exports = router;
