import fs from "fs";

export function cleanup(path) {
  if (fs.existsSync(path)) fs.unlinkSync(path);
}
