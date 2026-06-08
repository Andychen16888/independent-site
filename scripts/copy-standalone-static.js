const fs = require("fs")
const path = require("path")

const src = path.join(__dirname, "..", ".next", "static")
const dest = path.join(__dirname, "..", ".next", "standalone", ".next", "static")

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

if (srcFiles !== destFiles) {
  console.error(`ERROR: File count mismatch! Source: ${srcFiles}, Dest: ${destFiles}`)
  process.exit(1)
}
