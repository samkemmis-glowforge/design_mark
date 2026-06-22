import { embedText } from "../agent/tools/embed.js";
const v = await embedText("cozy winter gift for a coffee lover");
console.log("dims", v.length, "sample", v.slice(0, 3).map((x) => +x.toFixed(3)));
