import { readFile } from "node:fs/promises";
import { tagImage } from "../agent/tools/vision-tag.js";
const bytes = await readFile(process.argv[2]);
console.log(JSON.stringify(await tagImage(bytes, "image/jpeg"), null, 2));
