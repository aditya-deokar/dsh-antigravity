#!/usr/bin/env node
/**
 * Install this working copy into a local DSH profile.
 *
 * Usage:
 *   node scripts/install-local.mjs [profile]
 *
 * The default profile is "web".
 *
 * DSH forwards plugin arguments to pnpm through a shell without re-quoting
 * them, so a project path containing spaces would be split into several
 * packages. To keep this script safe for paths such as
 * "Documents/DeepSeek Plugins", it links the checkout to a stable no-space
 * junction under $DSH_HOME/local-plugins and installs that path instead.
 *
 * A linked package resolves Node imports from its real path, not from the
 * profile's node_modules. The script therefore also links the host's
 * @deepseek-ai package scope into this checkout so `@deepseek-ai/dsh-llm` and
 * friends resolve while developing. A normal registry/tarball install does
 * not need this.
 */
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, symlinkSync, unlinkSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const profile = process.argv[2] || "web";
const dshHome = process.env.DSH_HOME || join(homedir(), ".dsh");
const aliasDir = join(dshHome, "local-plugins");
const aliasPath = join(aliasDir, "dsh-antigravity");
const hostScope = join(dshHome, "profiles", "node_modules", "@deepseek-ai");

function replaceLink(path, target, type) {
  try {
    const stat = lstatSync(path);
    if (!stat.isSymbolicLink()) {
      throw new Error(`${path} exists and is not a link; move it aside and retry.`);
    }
    unlinkSync(path);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  mkdirSync(dirname(path), { recursive: true });
  symlinkSync(target, path, type);
}

function ensureAlias() {
  replaceLink(aliasPath, packageRoot, "junction");
  return aliasPath;
}

function ensureHostScope() {
  if (!existsSync(join(hostScope, "dsh-llm"))) {
    console.warn(
      `Warning: could not find ${hostScope}. The linked checkout may fail to import @deepseek-ai/dsh-llm.`,
    );
    return;
  }
  replaceLink(join(packageRoot, "node_modules", "@deepseek-ai"), hostScope, "junction");
}

function run(args, { optional = false } = {}) {
  const commandLine = ["dsh", ...args.map(quote)].join(" ");
  const result = spawnSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", commandLine], {
    cwd: packageRoot,
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) {
    if (optional) return false;
    throw result.error;
  }
  if (result.status !== 0 && !optional) {
    process.exitCode = result.status ?? 1;
    throw new Error(`dsh ${args.join(" ")} exited with ${result.status}`);
  }
  return result.status === 0;
}

function quote(value) {
  return /[\s"]/.test(value) ? `"${value.replaceAll('"', '\\"')}"` : value;
}

console.log(`Installing dsh-antigravity from ${packageRoot} into profile "${profile}"...`);
ensureHostScope();
const linkPath = ensureAlias();
run(["plugin", "--profile", profile, "remove", "dsh-antigravity"], { optional: true });
run(["plugin", "--profile", profile, "add", `link:${linkPath}`]);
console.log("Installed. Restart the DSH web server, then open Settings -> Antigravity.");
