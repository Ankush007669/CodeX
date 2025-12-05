import fs from "fs";
import fetch from "node-fetch";
import config from "../config.js";

export function extractFileId(link) {
  const match = link.match(/\/d\/(.*?)\//);
  return match ? match[1] : null;
}

export async function downloadGDrive(fileId, outPath) {
  const url = config.worker_url + "chunk?fileId=" + fileId;

  const res = await fetch(url);
  const stream = fs.createWriteStream(outPath);

  return new Promise((resolve) => {
    res.body.pipe(stream);
    res.body.on("end", resolve);
  });
}

