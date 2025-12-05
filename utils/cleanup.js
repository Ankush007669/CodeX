import fs from "fs";

export function cleanup(filePath){
    try { fs.unlinkSync(filePath); } catch(e){}
}
