// server.js (VPS Main Entry)

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs/promises'); // For file operations
const gdrive = require('./utils/gdrive'); // GDrive Downloader
const abyss = require('./utils/abyss'); // Abyss Uploader

const app = express();
const PORT = 3000;
const TEMP_DIR = path.join(__dirname, 'temp_downloads');
const CLOUDFLARE_WORKER_URL = 'https://codexmirror.trustedgamer007.workers.dev'; // Replace with your Worker URL

app.use(bodyParser.json());

// Ensure temp directory exists
fs.mkdir(TEMP_DIR, { recursive: true }).catch(console.error);

app.post('/api/upload', async (req, res) => {
    // 3. upload.js → Downloads file from GDrive → Saves to VPS
    const { drive_link, file_name, host, user_key } = req.body;

    if (!drive_link || !file_name || !host) {
        return res.status(400).json({ status: 'error', message: 'Missing required parameters.' });
    }

    const tempFilePath = path.join(TEMP_DIR, file_name);

    try {
        console.log(`[START] Downloading: ${drive_link}`);
        // *** CURRENT ISSUE IS HERE - gdrive.download() needs the fix ***
        await gdrive.download(drive_link, tempFilePath); 
        console.log(`[SUCCESS] Download complete: ${tempFilePath}`);

        // 4. upload.js → Sends file buffer to Worker
        // 5. Worker → Abyss upload
        // 6. Abyss returns slug
        // 7. Worker sends structured JSON to VPS
        const uploadResult = await abyss.upload(tempFilePath, file_name, host, CLOUDFLARE_WORKER_URL);

        // 8. VPS sends success JSON to PHP
        if (uploadResult.status === 'success') {
            console.log(`[SUCCESS] Uploaded to Abyss: ${uploadResult.embed}`);
            res.json(uploadResult);
        } else {
            console.error(`[ERROR] Abyss Upload Failed: ${uploadResult.message}`);
            res.status(500).json({ status: 'error', message: uploadResult.message });
        }

    } catch (error) {
        console.error(`[FATAL ERROR] Upload process failed: ${error.message}`);
        res.status(500).json({ status: 'error', message: error.message });
    } finally {
        // 7. Delete temp file
        try {
            await fs.unlink(tempFilePath);
            console.log(`[CLEANUP] Deleted temp file: ${tempFilePath}`);
        } catch (e) {
            if (e.code !== 'ENOENT') console.error(`[CLEANUP ERROR] Failed to delete temp file: ${e.message}`);
        }
    }
});

app.listen(PORT, () => {
    console.log(`VPS Auto Mirror API listening on port ${PORT}`);
});
