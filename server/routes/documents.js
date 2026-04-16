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
    updateDocumentVersion,
    syncLocalFiles,
    openInDesktop
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
router.get('/:id/version/:versionNumber', auth, downloadDocument);
router.get('/:id/version:versionNumber', auth, downloadDocument); // Handle malformed URLs with colon
router.post('/:id/version', auth, (req, res, next) => {
    // Check if it's a multipart request (typical for file uploads like PDF)
    // or a JSON request (typical for HTML content save like Word)
    if (req.headers['content-type']?.includes('multipart/form-data')) {
        upload.single('file')(req, res, next);
    } else {
        next();
    }
}, updateDocumentVersion);

router.post('/sync', auth, syncLocalFiles);
router.post('/:id/open-in-desktop', auth, openInDesktop);

module.exports = router;
