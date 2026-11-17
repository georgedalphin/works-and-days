import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
mkdirSync("dist", { recursive: true });
await build({ entryPoints: ["src/main.ts"], bundle: true, minify: true, format: "iife", target: "es2020", outfile: "dist/app.js", legalComments: "none" });
const js = readFileSync("dist/app.js", "utf8").replace(/<\/script/gi, "<\\/script");
const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Works & Days — Milestone 1</title>
<style>html,body{margin:0;height:100%;background:#1f2a3a;overflow:hidden}#game{width:100vw;height:100vh}canvas{image-rendering:pixelated}</style>
</head><body><div id="game"></div><script>${js}</script></body></html>`;
writeFileSync("dist/index.html", html);
console.log("built", (html.length/1024).toFixed(0), "KB");
