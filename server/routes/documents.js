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
    updateDocumentStatus,
    getAnnotations,
    addAnnotation,
    syncLocalFiles,
    openInDesktop,
    getPublicDocument,
    reuploadDocument
} = require('../controllers/documents');
const { handleWebDAV } = require('../controllers/webdav');
const auth = require('../middleware/auth');
const upload = require('../middleware/multer');
const router = express.Router();

router.get('/public/:id', getPublicDocument);
router.post('/upload', auth, upload.single('file'), uploadDocument);
router.get('/', auth, getDocuments);
router.get('/download/:id', auth, downloadDocument);
router.get('/download/:id/:dummy', auth, downloadDocument); // Handle dummy extensions for Office apps
router.get('/view/:id', auth, viewDocument);
router.delete('/:id', auth, deleteDocument);
router.patch('/:id/star', auth, toggleStar);
router.post('/:id/share', auth, shareDocument);
router.post('/:id/unshare', auth, unshareDocument);
router.patch('/:id', auth, updateDocumentMetadata);
router.patch('/:id/status', auth, updateDocumentStatus);
router.get('/:id/annotations', auth, getAnnotations);
router.post('/:id/annotations', auth, addAnnotation);
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

router.put('/:id/reupload', auth, upload.single('file'), reuploadDocument);

router.post('/sync', auth, syncLocalFiles);
router.post('/:id/open-in-desktop', auth, openInDesktop);

// WebDAV for Office Auto-Save
router.all('/dav/:id/:token/:filename', handleWebDAV);

module.exports = router;
