import express from "express";
import { extractFileId, downloadGDrive } from "../utils/gdrive.js";
import { uploadToAbyssLocal } from "../utils/abyss.js";
import { cleanup } from "../utils/cleanup.js";
import config from "../config.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { file_name, drive_link } = req.body;

        if (!file_name || !drive_link)
            return res.json({ status: "error", message: "Missing fields" });

        const fileId = extractFileId(drive_link);
        if (!fileId) {
            return res.json({
                status: "error",
                message: "Invalid Google Drive link"
            });
        }

        const filePath = config.tmp_dir + file_name;

        // STEP 1: Download from Google Drive → VPS
        await downloadGDrive(fileId, filePath);

        // STEP 2: Upload VPS file → Abyss
        const abyssResult = await uploadAbyss(fileId);

        // STEP 3: Delete temporary file
        cleanup(filePath);

        return res.json(abyssResult);

    } catch (err) {
        return res.json({
            status: "error",
            message: "Server error: " + err.toString()
        });
    }
});

export default router;
