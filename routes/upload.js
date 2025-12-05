import express from "express";
import fs from "fs";
import fetch from "node-fetch";
import { extractFileId, downloadGDrive } from "../utils/gdrive.js";
import { cleanup } from "../utils/cleanup.js";
import config from "../config.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    let { file_name, drive_link, host } = req.body;

    // Validate Google Drive link
    if (!drive_link)
      return res.json({ status: "error", message: "Missing Google Drive link" });

    // Auto-generate filename if missing
    if (!file_name || file_name.trim() === "") {
      file_name = "video_" + Date.now() + ".mp4";
    }

    // Default host = Abyss
    if (!host) host = "abyss";

    const fileId = extractFileId(drive_link);

    if (!fileId)
      return res.json({ status: "error", message: "Invalid Google Drive link" });

    const filePath = config.tmp_dir + file_name;

    console.log("➡ Downloading from Google Drive:", fileId);

    // STEP 1 — Google Drive से FULL file डाउनलोड
    await downloadGDrive(fileId, filePath);

    console.log("✔ Download complete:", filePath);
    console.log("➡ Uploading to worker:", host.toUpperCase());

    // STEP 2 — Worker को file भेजना
    const uploadUrl =
      host === "abyss"
        ? `${config.worker_url}abyss-upload?key=${config.abyss_key}`
        : `${config.worker_url}rpm-upload?key=${config.rpm_key}`;

    const workerResponse = await fetch(uploadUrl, {
      method: "POST",
      body: fs.readFileSync(filePath) // READ FULL FILE, NOT STREAM
    });

    const json = await workerResponse.json();

    console.log("✔ Worker response:", json);

    // STEP 3 — temp file remove
    cleanup(filePath);

    return res.json(json);

  } catch (err) {
    console.error("🔥 Error:", err);
    return res.json({
      status: "error",
      message: err.toString()
    });
  }
});

export default router;
