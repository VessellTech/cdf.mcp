#!/usr/bin/env node
/**
 * mcp:release — bumpa a versão do cdf-mcp-server e publica no MCP Registry.
 *
 * Uso:
 *   npm run mcp:release            # bump de patch (0.1.0 -> 0.1.1)
 *   npm run mcp:release -- minor   # bump de minor  (0.1.0 -> 0.2.0)
 *   npm run mcp:release -- major   # bump de major  (0.1.0 -> 1.0.0)
 *   npm run mcp:release -- --publish   # valida E publica (exige login prévio)
 *
 * O metadata do Registry é imutável: cada mudança exige um bump de versão
 * (igual npm). Este script sincroniza a versão entre server.json e
 * package.json, valida o server.json e, opcionalmente, publica.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SERVER_JSON = join(ROOT, "server.json");
const PACKAGE_JSON = join(ROOT, "package.json");

const args = process.argv.slice(2);
const wantPublish = args.includes("--publish");
const typeArg = args.find((a) => a === "major" || a === "minor" || a === "patch") ?? "patch";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, obj) {
  writeFileSync(path, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function bump(version, type) {
  const m = /^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?$/.exec(version);
  if (!m) {
    console.error(`✗ Versão inválida em server.json/package.json: "${version}"`);
    process.exit(1);
  }
  let [, major, minor, patch, pre] = m;
  if (type === "major") {
    major = String(Number(major) + 1);
    minor = "0";
    patch = "0";
  } else if (type === "minor") {
    minor = String(Number(minor) + 1);
    patch = "0";
  } else {
    patch = String(Number(patch) + 1);
  }
  // Bump de release tira pré-release (0.1.0-beta.1 -> 0.1.0)
  return `${major}.${minor}.${patch}${pre && type === "patch" ? pre : ""}`;
}

function runPublisher(args2) {
  const cmd = process.platform === "win32" ? "mcp-publisher.exe" : "mcp-publisher";
  try {
    if (process.platform === "win32") {
      // shell:true no Windows exige o comando como string única (args fixos internos)
      execFileSync([cmd, ...args2].join(" "), { cwd: ROOT, stdio: "inherit", shell: true });
    } else {
      execFileSync(cmd, args2, { cwd: ROOT, stdio: "inherit" });
    }
  } catch {
    console.error("\n✗ Falha ao executar o mcp-publisher. Confira se ele está no PATH");
    console.error("  (adicione a pasta dele ao PATH ou rode mcp-publisher manualmente).");
    process.exit(1);
  }
}

const server = readJson(SERVER_JSON);
const pkg = readJson(PACKAGE_JSON);

const oldVersion = server.version;
if (!pkg.version || pkg.version !== oldVersion) {
  console.warn(`⚠ package.json versão ${pkg.version} difere de server.json ${oldVersion} — sincronizando para a nova versão.`);
}
const nextVersion = bump(oldVersion, typeArg);

server.version = nextVersion;
pkg.version = nextVersion;
writeJson(SERVER_JSON, server);
writeJson(PACKAGE_JSON, pkg);

console.log(`✓ server.json e package.json: ${oldVersion} -> ${nextVersion}`);

console.log("\nValidando contra o MCP Registry...");
runPublisher(["validate"]);

if (wantPublish) {
  console.log("\nPublicando no MCP Registry...");
  runPublisher(["publish"]);
  console.log(`✓ ${server.name} ${nextVersion} publicado.`);
} else {
  console.log("\nTudo certo. Para publicar:");
  console.log(`  mcp-publisher login github --token <PAT com read:org>  (namespace de org exige Owner)`);
  console.log("  mcp-publisher publish");
  console.log("  — ou rode: npm run mcp:release -- --publish");
}
