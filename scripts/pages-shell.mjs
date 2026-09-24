import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = existsSync("dist/client") ? "dist/client" : "dist";
const shell = ["_shell.html", "index.html"].map((name) => join(dir, name)).find((path) => existsSync(path));
if (!shell) {
  console.error(`No SPA shell in ${dir}`);
  process.exit(1);
}
const index = join(dir, "index.html");
const missing = join(dir, "404.html");
if (shell !== index) copyFileSync(shell, index);
let html = readFileSync(index, "utf8");
const css = readdirSync(join(dir, "assets")).find((name) => name.startsWith("styles-") && name.endsWith(".css"));
if (css) html = html.replace(/assets\/styles-[A-Za-z0-9_-]+\.css/g, `assets/${css}`);
writeFileSync(index, html);
writeFileSync(missing, html);
console.log(`GitHub Pages shell ready in ${dir}`);
