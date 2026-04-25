require('dotenv').config();
const { uploadToSFTP } = require('./utils/sftp');

const verifyFix = async () => {
    const content = Buffer.from('Testing fix with absolute path standardization.');
    const department = 'IT';
    const extension = 'txt';
    const fileName = `fix-test-${Date.now()}.txt`;
    
    // In the controller, we construct it like this now:
    const basePath = (process.env.SFTP_BASE_PATH || 'uploads').trim().replace(/^\//, '').replace(/\/$/, '');
    const remotePath = `/${basePath}/${department}/${extension}/${fileName}`;
    
    console.log('--- VERIFICATION START ---');
    console.log(`Base Path from Env: ${process.env.SFTP_BASE_PATH}`);
    console.log(`Constructed Remote Path: ${remotePath}`);
    
    try {
        await uploadToSFTP(content, remotePath);
        console.log('--- VERIFICATION SUCCESS ---');
    } catch (err) {
        console.error('--- VERIFICATION FAILED ---');
        console.error(err);
    }
};

verifyFix();
