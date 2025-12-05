import fs from "fs";
import fetch from "node-fetch";

export function extractFileId(link) {
    // Detect IDs from all Google Drive link formats
    let match = link.match(/\/d\/([^\/]+)/);
    if (match) return match[1];

    match = link.match(/id=([^&]+)/);
    if (match) return match[1];

    return null;
}

export async function downloadGDrive(fileId, outputPath) {
    const base = `https://drive.google.com/uc?export=download&id=${fileId}`;

    let res = await fetch(base);

    const contentType = res.headers.get("content-type");

    // If Google blocks direct download, it sends HTML instead of file
    if (contentType && contentType.includes("text/html")) {
        const html = await res.text();

        // Try extracting confirm token from multiple formats
        let token =
            html.match(/confirm=([^&]+)/)?.[1] ||
            html.match(/data-token="([^"]+)"/)?.[1] ||
            html.match(/"confirm":"([^"]+)"/)?.[1];

        if (!token) {
            throw new Error("Google Drive confirmation token not found");
        }

        // Try again with confirm token
        const bypassUrl = `https://drive.google.com/uc?export=download&confirm=${token}&id=${fileId}`;
        res = await fetch(bypassUrl);
    }

    if (!res.ok) {
        throw new Error("Google Drive download request failed");
    }

    // Download stream to disk
    const fileStream = fs.createWriteStream(outputPath);

    return new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on("error", reject);
        fileStream.on("finish", resolve);
    });
}
