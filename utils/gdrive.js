import fetch from "node-fetch";
import fs from "fs";
import config from "../config.js";

// Extract Google Drive File ID
export function extractFileId(link) {
    const match = link.match(/\/d\/(.*?)\//);
    return match ? match[1] : null;
}

// Sequential Chunk Downloader via Worker
export async function downloadGDrive(fileId, filePath) {
    const chunkSize = 5 * 1024 * 1024; // 5MB safe chunk
    let start = 0;
    let end = chunkSize - 1;
    let done = false;

    const stream = fs.createWriteStream(filePath);

    while (!done) {
        const url = `${config.worker_url}chunk?fileId=${fileId}&start=${start}&end=${end}`;
        const res = await fetch(url);

        if (!res.ok) throw new Error("Worker chunk fetch failed " + res.status);

        const buf = Buffer.from(await res.arrayBuffer());
        stream.write(buf);

        if (buf.length < chunkSize) done = true;

        start += chunkSize;
        end += chunkSize;
    }

    stream.end();
    return true;
}
