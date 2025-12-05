import express from "express";
import fs from "fs";
import fetch from "node-fetch";
import { extractFileId, downloadGDrive } from "../utils/gdrive.js";
import { cleanup } from "../utils/cleanup.js";
import config from "../config.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { file_name, drive_link } = req.body;

    if (!file_name || !drive_link)
      return res.json({ status: "error", message: "Missing fields" });

    const fileId = extractFileId(drive_link);

    if (!fileId)
      return res.json({ status: "error", message: "Invalid Google Drive link" });

    const filePath = config.tmp_dir + file_name;

    // STEP 1: Download GDrive → temp file
    await downloadGDrive(fileId, filePath);

    // STEP 2: Stream file to Worker uploader
    const uploadUrl =
    host === "abyss"
    ? `${config.worker_url}abyss-upload?key=${config.abyss_key}`
    : `${config.worker_url}rpm-upload?key=${config.rpm_key}`;

    const workerUpload = await fetch(uploadUrl, {
      method: "POST",
      body: fs.createReadStream(filePath)
    });
    
    const finalJson = await workerUpload.json();


    // STEP 3: Cleanup
    cleanup(filePath);

    return res.json(finalJson);

  } catch (err) {
    return res.json({
      status: "error",
      message: err.toString()
    });
  }
});

export default router;

