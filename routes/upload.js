import express from "express";
import { extractFileId, downloadGDrive } from "../utils/gdrive.js";
import { uploadAbyss } from "../utils/abyss.js";
import { cleanup } from "../utils/cleanup.js";
import config from "../config.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { file_name, drive_link } = req.body;

        if (!file_name || !drive_link)
            return res.json({ status: "error", message: "Missing fields" });

        const fileId = extractFileId(drive_link);
        if (!fileId) return res.json({ status: "error", message: "Invalid GDrive link" });

        const filePath = config.tmp_dir + file_name;

        // 1) Google Drive → VPS download
        await downloadGDrive(fileId, filePath);

        // 2) VPS → Abyss upload
        const result = await uploadAbyss(filePath);

        // 3) Temp file delete
        cleanup(filePath);

        return res.json(result);

    } catch (err) {
        return res.json({ status: "error", message: err.toString() });
    }
});

export default router;
