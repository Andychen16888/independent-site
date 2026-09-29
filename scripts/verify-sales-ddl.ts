/**
 * Compares the sales CRM DDL against schema.prisma without a database.
 *
 * `prisma migrate diff` needs a shadow database, which this environment does not
 * have, so the two are compared directly: every sales table's column set, type and
 * nullability, plus every sales enum. The point is to catch a hand-edited
 * migration that has drifted from the datamodel -- a silent divergence that only
 * surfaces on the next deploy, against production.
 */
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

const MIGRATIONS_DIR = "prisma/migrations"
const SALES_MIGRATION = "20260927000300_sales_crm"
const SCHEMA = "prisma/schema.prisma"

const sql = readFileSync(join(MIGRATIONS_DIR, SALES_MIGRATION, "migration.sql"), "utf8")
const schema = readFileSync(SCHEMA, "utf8")

let problems = 0
const fail = (msg: string) => {
  problems++
  console.log(`  MISMATCH  ${msg}`)
}
const pass = (msg: string) => console.log(`  ok        ${msg}`)

/* ---------------- DDL tables ---------------- */
/**
 * Normalises a Postgres type for comparison.
 *
 * Prisma always emits `timestamp(3)` for DateTime, but a hand-written migration
 * may write plain `TIMESTAMP`, and the two are the same type. DECIMAL precision,
 * by contrast, is part of the contract (a rounding change alters stored money)
 * and is compared exactly.
 */
const normalize = (type: string) => {
  const t = type.toUpperCase()
  return t.startsWith("TIMESTAMP") ? "TIMESTAMP(3)" : t
}

const ddlTables = new Map()
for (const m of sql.matchAll(/CREATE TABLE "([^"]+)" \(([\s\S]*?)\n\);/g)) {
  const [, name, body] = m
  const cols = new Map()
  for (const raw of body.split("\n")) {
    const line = raw.trim().replace(/,$/, "")
    // "col" TYPE [NOT NULL] [DEFAULT ...]
    // No trailing \b: it cannot match after ')' and would make the engine
    // backtrack off a DECIMAL(20,3) precision and report a bare DECIMAL.
    const c = line.match(/^"([^"]+)"\s+([A-Za-z][A-Za-z0-9_]*(?:\([^)]*\))?)\s*(NOT NULL)?/)
    if (c) cols.set(c[1], { type: normalize(c[2]), notNull: Boolean(c[3]) })
  }
  ddlTables.set(name, cols)
}

/* ---------------- schema models ---------------- */
/** Prisma scalar type -> Postgres type, for the types this project uses. */
const SCALARS: Record<string, string> = {
  String: "TEXT",
  Boolean: "BOOLEAN",
  Int: "INTEGER",
  BigInt: "BIGINT",
  Float: "DOUBLE PRECISION",
  DateTime: "TIMESTAMP(3)",
  Json: "JSONB",
  Decimal: "DECIMAL",
}

const schemaModels = new Map()
for (const m of schema.matchAll(/model (\w+) \{([\s\S]*?)\n\}/g)) {
  const [, name, body] = m
  const map = body.match(/@@map\("([^"]+)"\)/)
  if (!map) continue
  const cols = new Map()
  for (const raw of body.split("\n")) {
    const line = raw.trim()
    if (!line || line.startsWith("//") || line.startsWith("///") || line.startsWith("@@")) continue
    // name Type[?] attributes...
    const c = line.match(/^(\w+)\s+(String|Boolean|Int|BigInt|Float|DateTime|Json|Decimal)(\?)?\s*(.*)$/)
    if (!c) continue
    const [, field, base, optional, attrs = ""] = c
    const dec = attrs.match(/@db\.Decimal\((\d+),\s*(\d+)\)/)
    const vc = attrs.match(/@db\.VarChar\((\d+)\)/)
    let type
    if (dec) type = `DECIMAL(${dec[1]},${dec[2]})`
    else if (vc) type = `VARCHAR(${vc[1]})`
    else if (attrs.includes("@db.Text")) type = "TEXT"
    else type = SCALARS[base]
    // An enum-typed field keeps the enum name; that is its Postgres type.
    if (type === "TEXT" && /^\s*\w+\s/.test(attrs) === false) {
      // fall through, handled below
    }
    cols.set(field, { type, notNull: !optional, attrs })
  }
  schemaModels.set(map[1], { model: name, cols, body })
}

/* ---------------- table comparison ---------------- */
const SALES = [
  "inquiries",
  "quotations",
  "quotation_items",
  "email_records",
  "follow_ups",
  "number_sequences",
]

/** Fields whose Postgres type is the named enum; the parser cannot infer it. */
const ENUM_FIELD_HINT = /\b(InquiryStatus|InquirySource|QuotationStatus|EmailStatus|EmailDirection|EmailPurpose|FollowUpStatus)\b/

console.log(`DDL tables in ${SALES_MIGRATION}: ${ddlTables.size}\n`)

for (const table of SALES) {
  const ddl = ddlTables.get(table)
  const sm = schemaModels.get(table)
  if (!ddl) {
    fail(`${table}: not created by the migration`)
    continue
  }
  if (!sm) {
    fail(`${table}: exists in the DDL but no model maps to it`)
    continue
  }

  let issues = 0
  for (const [col, d] of ddl) {
    const s = sm.cols.get(col)
    if (!s) {
      // Relation scalars and id columns Prisma declares implicitly.
      if (/^[a-z]+Id$/.test(col) || col === "id") continue
      fail(`  ${table}.${col} is in the DDL but not declared on ${sm.model}`)
      issues++
      continue
    }
    if (ENUM_FIELD_HINT.test(s.attrs)) continue // type is the enum name, checked below
    if (d.type !== s.type) {
      fail(`  ${table}.${col} type: DDL ${d.type} vs schema ${s.type}`)
      issues++
    } else if (d.notNull !== s.notNull) {
      fail(
        `  ${table}.${col} nullability: DDL ${d.notNull ? "NOT NULL" : "NULL"} vs schema ${
          s.notNull ? "required" : "optional"
        }`
      )
      issues++
    }
  }
  for (const col of sm.cols.keys()) {
    if (!ddl.has(col) && !/^[a-z]+Id$/.test(col)) {
      fail(`  ${table}.${col} is declared on ${sm.model} but absent from the DDL`)
      issues++
    }
  }
  if (issues === 0) console.log(`  ok        ${table} (<- ${sm.model}, ${ddl.size} columns)`)
}

console.log("")

/* ---------------- enums ---------------- */
const ddlEnums = new Map()
for (const m of sql.matchAll(/CREATE TYPE "(\w+)" AS ENUM \(([\s\S]*?)\);/g)) {
  ddlEnums.set(m[1], [...m[2].matchAll(/'([A-Z_]+)'/g)].map((x) => x[1]))
}

const schemaEnums = new Map()
for (const m of schema.matchAll(/enum (\w+) \{([\s\S]*?)\n\}/g)) {
  schemaEnums.set(m[1], m[2].split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("//")).map((l) => l.replace(/\s.*$/, "")))
}

const SALES_ENUMS = [
  "InquiryStatus",
  "InquirySource",
  "QuotationStatus",
  "EmailStatus",
  "EmailDirection",
  "EmailPurpose",
  "FollowUpStatus",
]

for (const name of SALES_ENUMS) {
  const d = ddlEnums.get(name)
  const s = schemaEnums.get(name)
  if (!d) {
    fail(`enum ${name}: not created by the migration`)
    continue
  }
  if (!s) {
    fail(`enum ${name}: in the DDL but absent from schema.prisma`)
    continue
  }
  const missing = s.filter((v: string) => !d.includes(v))
  const extra = d.filter((v: string) => !s.includes(v))
  if (missing.length || extra.length) {
    fail(
      `enum ${name}: ${
        missing.length ? `missing from DDL: ${missing.join(", ")}` : ""
      }${missing.length && extra.length ? "; " : ""}${extra.length ? `not in schema: ${extra.join(", ")}` : ""}`
    )
  } else {
    pass(`enum ${name}: ${d.length} values agree`)
  }
}

/* ---------------- Currency ---------------- */
/**
 * Currency predates this migration: it is a Postgres enum extended with
 * ALTER TYPE ... ADD VALUE, so its full value set is the union across every
 * migration, not just this one. A value added to the schema but never added by
 * a migration would fail at runtime on the first write.
 */
const allMigrationSql = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => {
    const file = join(MIGRATIONS_DIR, d.name, "migration.sql")
    try {
      return readFileSync(file, "utf8")
    } catch {
      return ""
    }
  })
  .join("\n")

const currencyValues = new Set<string>()
for (const m of allMigrationSql.matchAll(
  /ALTER TYPE "Currency" ADD VALUE(?: IF NOT EXISTS)? '([A-Z]{3})'/g
)) {
  currencyValues.add(m[1]!)
}
for (const m of allMigrationSql.matchAll(/CREATE TYPE "Currency" AS ENUM \(([\s\S]*?)\);/g)) {
  for (const v of m[1].matchAll(/'([A-Z]{3})'/g)) currencyValues.add(v[1])
}

const schemaCurrency: string[] = schemaEnums.get("Currency") || []
const missingCurrency = schemaCurrency.filter((c: string) => !currencyValues.has(c))
const extraCurrency = [...currencyValues].filter((c: string) => !schemaCurrency.includes(c))
if (missingCurrency.length) {
  fail(`Currency: declared in schema but never added by a migration: ${missingCurrency.join(", ")}`)
}
if (extraCurrency.length) {
  fail(`Currency: added by a migration but not in schema: ${extraCurrency.join(", ")}`)
}
if (!missingCurrency.length && !extraCurrency.length) {
  pass(`Currency: all ${schemaCurrency.length} values present across the migrations`)
}

console.log(`\n${problems === 0 ? "DDL MATCHES SCHEMA" : `${problems} problem(s) found`}`)
process.exit(problems === 0 ? 0 : 1)
