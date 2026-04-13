const multer = require('multer');

// Use memoryStorage since Vercel's filesystem is read-only
const storage = multer.memoryStorage();

const upload = multer({ storage });

module.exports = upload;
