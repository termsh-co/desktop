#!/usr/bin/env node
/**
 * Ensures every locale has the same translation keys as `en` (reference).
 * Usage: node scripts/check-i18n-keys.mjs
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESOURCES_DIR = path.join(__dirname, "../src/i18n/resources");
const REF_LOCALE = "en";
const LOCALES = ["en", "tr", "zh", "es", "de"];

function flattenKeys(obj, prefix = "") {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

async function keysForLocale(locale) {
  const dir = path.join(RESOURCES_DIR, locale);
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
  const map = new Map();
  for (const file of files) {
    const ns = file.replace(/\.json$/, "");
    const raw = await readFile(path.join(dir, file), "utf8");
    map.set(ns, new Set(flattenKeys(JSON.parse(raw))));
  }
  return map;
}

const ref = await keysForLocale(REF_LOCALE);
let failed = false;

for (const locale of LOCALES) {
  if (locale === REF_LOCALE) continue;
  const target = await keysForLocale(locale);
  for (const [ns, refKeys] of ref) {
    const targetKeys = target.get(ns);
    if (!targetKeys) {
      console.error(`[${locale}] missing namespace: ${ns}`);
      failed = true;
      continue;
    }
    for (const key of refKeys) {
      if (!targetKeys.has(key)) {
        console.error(`[${locale}] ${ns}: missing key "${key}"`);
        failed = true;
      }
    }
    for (const key of targetKeys) {
      if (!refKeys.has(key)) {
        console.error(`[${locale}] ${ns}: extra key "${key}" (not in ${REF_LOCALE})`);
        failed = true;
      }
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log(`i18n key parity OK (${LOCALES.join(", ")})`);
