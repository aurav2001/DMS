const Client = require('ssh2-sftp-client');

const sftpConfig = {
    host: process.env.SFTP_HOST,
    port: process.env.SFTP_PORT || 22,
    username: process.env.SFTP_USERNAME,
    password: process.env.SFTP_PASSWORD
    // Add privateKey support if needed
};

const uploadToSFTP = async (fileBuffer, remotePath) => {
    const sftp = new Client();
    try {
        await sftp.connect(sftpConfig);
        
        // Extract directory and ensure it exists
        const parts = remotePath.split('/');
        if (parts.length > 1) {
            const remoteDir = parts.slice(0, -1).join('/');
            const exists = await sftp.exists(remoteDir);
            if (!exists) {
                await sftp.mkdir(remoteDir, true);
            }
        }

        await sftp.put(fileBuffer, remotePath);
        return true;
    } catch (err) {
        console.error('SFTP Upload Error:', err);
        throw err;
    } finally {
        await sftp.end();
    }
};

const downloadFromSFTP = async (remotePath) => {
    const sftp = new Client();
    try {
        await sftp.connect(sftpConfig);
        const data = await sftp.get(remotePath);
        return data; // Returns a Buffer
    } catch (err) {
        console.error('SFTP Download Error:', err);
        throw err;
    } finally {
        await sftp.end();
    }
};

module.exports = { uploadToSFTP, downloadFromSFTP };
