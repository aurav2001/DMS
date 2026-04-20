const express = require('express');
const { getPublicData, viewPublicDocument, sendContactEmail } = require('../controllers/public');
const router = express.Router();

router.get('/documents', getPublicData);
router.get('/view/:id', viewPublicDocument);
router.post('/contact', sendContactEmail);

module.exports = router;
