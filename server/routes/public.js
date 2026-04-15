const express = require('express');
const { getPublicData, viewPublicDocument } = require('../controllers/public');
const router = express.Router();

router.get('/documents', getPublicData);
router.get('/view/:id', viewPublicDocument);

module.exports = router;
