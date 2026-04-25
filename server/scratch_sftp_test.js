const Client = require('ssh2-sftp-client');

const testUpload = async () => {
    const sftp = new Client();
    const config = {
        host: 'server13.ftpgrid.com',
        port: 22,
        username: 'J3U.ep5jhnwt',
        password: 'tqE|%moRXO?/[-{unwF]aJy07>#pN7^~'
    };

    const remoteDir = 'docvault/TestDept/testext';
    const remotePath = `${remoteDir}/test-file-${Date.now()}.txt`;
    const content = Buffer.from('Hello SFTP!');

    console.log('Testing SFTP Upload with Directory Creation...');
    try {
        await sftp.connect(config);
        console.log('SUCCESS: Connected to SFTP');
        
        console.log(`Checking directory: ${remoteDir}`);
        const exists = await sftp.exists(remoteDir);
        if (!exists) {
            console.log(`Creating directory: ${remoteDir}`);
            await sftp.mkdir(remoteDir, true);
        } else {
            console.log('Directory already exists');
        }

        console.log(`Uploading to: ${remotePath}`);
        await sftp.put(content, remotePath);
        console.log('SUCCESS: File uploaded');

        // Cleanup
        await sftp.delete(remotePath);
        console.log('Cleanup: Deleted test file');
    } catch (err) {
        console.error('FAILURE:', err.message);
        if (err.code) console.error('Error Code:', err.code);
    } finally {
        await sftp.end();
    }
};

testUpload();
