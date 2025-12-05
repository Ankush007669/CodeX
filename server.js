// server.js (VPS Main Entry)

import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// Utility modules are now imported with a .js extension
import { download } from './utils/gdrive.js'; 
import { upload } from './utils/abyss.js'; 

// ESM does not define __dirname globally, so we define it manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const TEMP_DIR = path.join(__dirname, 'temp_downloads');
const CLOUDFLARE_WORKER_URL = 'https://your-worker-domain.workers.dev'; // Replace with your Worker URL

app.use(bodyParser.json());

// Ensure temp directory exists
fs.mkdir(TEMP_DIR, { recursive: true }).catch(console.error);

app.post('/api/upload', async (req, res) => {
    const { drive_link, file_name, host, user_key } = req.body;

    if (!drive_link || !file_name || !host) {
        return res.status(400).json({ status: 'error', message: 'Missing required parameters.' });
    }

    const tempFilePath = path.join(TEMP_DIR, file_name);

    try {
        console.log(`[START] Downloading: ${drive_link}`);
        // *** GDrive Download is the next hurdle to fix ***
        await download(drive_link, tempFilePath); 
        console.log(`[SUCCESS] Download complete: ${tempFilePath}`);

        const uploadResult = await upload(tempFilePath, file_name, host, CLOUDFLARE_WORKER_URL);

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
