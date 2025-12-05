// utils/gdrive.js

const axios = require('axios');
const fs = require('fs');
const { Writable } = require('stream');

// *** THIS NEEDS THE UNIVERSAL DOWNLOADER FIX ***

/**
 * Downloads a Google Drive file to a local path.
 * @param {string} driveUrl - The Google Drive share link.
 * @param {string} outputPath - The path to save the file.
 */
async function download(driveUrl, outputPath) {
    const fileIdMatch = driveUrl.match(/id=([a-zA-Z0-9_-]+)/) || driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!fileIdMatch) {
        throw new Error("Invalid Google Drive URL or File ID not found.");
    }
    const fileId = fileIdMatch[1];
    
    // Initial download attempt URL
    let downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    try {
        // Step 1 & 2: Initial attempt
        let response = await axios({
            method: 'get',
            url: downloadUrl,
            responseType: 'stream',
            maxRedirects: 0,
            validateStatus: status => status >= 200 && status < 400 || status === 302,
        });

        // Step 3 (OLD/BROKEN LOGIC): If a redirection or confirmation is needed
        if (response.status === 302 || (response.headers['content-type'] && response.headers['content-type'].includes('text/html'))) {
            const htmlContent = response.data instanceof Writable ? await streamToString(response.data) : response.data.toString();
            
            // The RegEx below is currently failing!
            const confirmTokenMatch = htmlContent.match(/confirm=([a-zA-Z0-9_-]+)/);

            if (!confirmTokenMatch) {
                // *** THIS IS THE LINE THROWING THE ERROR ***
                throw new Error("Google Drive confirmation token not found (New Google Update). Fix required.");
            }
            
            // Step 4: Retry with confirm token (OLD/BROKEN LOGIC)
            const confirmToken = confirmTokenMatch[1];
            downloadUrl = `${downloadUrl}&confirm=${confirmToken}`;

            response = await axios({
                method: 'get',
                url: downloadUrl,
                responseType: 'stream',
                maxRedirects: 10
            });
        }
        
        // Step 5: Stream file to disk
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

    } catch (error) {
        // Cleanup on failure
        if (fs.existsSync(outputPath)) await fs.promises.unlink(outputPath);
        throw error;
    }
}

// Utility to read stream to string (for HTML parsing)
function streamToString(stream) {
    const chunks = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    })
}

export default = { download };
