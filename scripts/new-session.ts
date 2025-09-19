import * as fs from "fs";
import * as path from "path";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const titleArg = process.argv.find(a => a.startsWith("--title=")) || "";
const zoneArg  = process.argv.find(a => a.startsWith("--zone="))  || "";
const kindArg  = process.argv.find(a => a.startsWith("--kind="))  || "";

const title = titleArg.split("=")[1] || "session";
const zone  = zoneArg.split("=")[1]  || "";
const kind  = kindArg.split("=")[1]  || "thought";

const today = new Date().toISOString().slice(0,10);
const file  = `${today}--${slugify(title)}.md`;
const dest  = path.join("docs","sessions",file);

const header = [
  `# ${title}`,
  zone ? `Zone: ${zone}` : "",
  `Kind: ${kind}`,
  ""
].filter(Boolean).join("\n");

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, header);
console.log(dest);
