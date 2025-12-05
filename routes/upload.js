import express from "express";
import { extractFileId, downloadGDrive } from "../utils/gdrive.js";
import { uploadAbyss } from "../utils/abyss.js";
import { uploadRPM } from "../utils/rpmshare.js";
import { cleanup } from "../utils/cleanup.js";
import config from "../config.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { file_name, drive_link, host } = req.body;

        if (!file_name || !drive_link || !host)
            return res.json({ status: "error", message: "Missing fields" });

        const fileId = extractFileId(drive_link);
        if (!fileId) return res.json({ status: "error", message: "Invalid GDrive link" });

        const filePath = config.tmp_dir + file_name;

        // Download
        await downloadGDrive(fileId, filePath);

        let result;
        if (host === "abyss") result = await uploadAbyss(filePath);
        else if (host === "rpm") result = await uploadRPM(filePath);
        else result = { status:"error", message:"Invalid host" };

        cleanup(filePath);
        return res.json(result);

    } catch (err) {
        return res.json({ status: "error", message: err.toString() });
    }
});

export default router;
