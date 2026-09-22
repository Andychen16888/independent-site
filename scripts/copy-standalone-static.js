/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs")
const path = require("path")

const src = path.join(__dirname, "..", ".next", "static")
const dest = path.join(__dirname, "..", ".next", "standalone", ".next", "static")

const pubSrc = path.join(__dirname, "..", "public")
const pubDest = path.join(__dirname, "..", ".next", "standalone", "public")

if (!fs.existsSync(src)) {
  console.error(`ERROR: Source directory not found: ${src}`)
  console.error("Did 'next build' run successfully?")
  process.exit(1)
}

// Remove dest first to ensure clean copy
if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true })
}

fs.mkdirSync(dest, { recursive: true })
fs.cpSync(src, dest, { recursive: true })

const srcFiles = fs.readdirSync(src, { recursive: true }).length
const destFiles = fs.readdirSync(dest, { recursive: true }).length

console.log(`Copied ${destFiles} files from .next/static to .next/standalone/.next/static`)

// Standalone 输出不会自带 public/ 目录，服务端从 .next/standalone/public 提供静态文件。
// 不拷贝的话 /images/hero/*.jpg 等站点默认图片在重新构建后就会 404。
if (!fs.existsSync(pubSrc)) {
  console.error(`ERROR: public directory not found: ${pubSrc}`)
  process.exit(1)
}
if (fs.existsSync(pubDest)) {
  fs.rmSync(pubDest, { recursive: true, force: true })
}
fs.mkdirSync(pubDest, { recursive: true })
fs.cpSync(pubSrc, pubDest, { recursive: true })

const pubSrcFiles = fs.readdirSync(pubSrc, { recursive: true }).length
const pubDestFiles = fs.readdirSync(pubDest, { recursive: true }).length

console.log(`Copied ${pubDestFiles} files from public to .next/standalone/public`)

if (srcFiles !== destFiles) {
  console.error(`ERROR: File count mismatch! Source: ${srcFiles}, Dest: ${destFiles}`)
  process.exit(1)
}

if (pubSrcFiles !== pubDestFiles) {
  console.error(`ERROR: public file count mismatch! Source: ${pubSrcFiles}, Dest: ${pubDestFiles}`)
  process.exit(1)
}
