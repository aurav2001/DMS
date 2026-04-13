const express = require('express');
const { getPublicData } = require('../controllers/public');
const router = express.Router();

router.get('/documents', getPublicData);

module.exports = router;
