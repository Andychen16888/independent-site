const fs = require("fs")
const path = require("path")

const src = path.join(__dirname, "..", ".next", "static")
const dest = path.join(__dirname, "..", ".next", "standalone", ".next", "static")

if (!fs.existsSync(src)) {
  console.error(`ERROR: Source directory not found: ${src}`)
  console.error("Did 'next build' run successfully?")
  process.exit(1)
}

fs.mkdirSync(dest, { recursive: true })
fs.cpSync(src, dest, { recursive: true })

const count = fs.readdirSync(dest, { recursive: true }).length
console.log(`Copied ${count} files from .next/static to .next/standalone/.next/static`)
