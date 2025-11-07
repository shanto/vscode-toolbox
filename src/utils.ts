import os from "node:os";
import path from "node:path";
import subprocess from "node:child_process";

import yaml from "js-yaml";
import kleur from "kleur";
import type { PromptObject } from "prompts";

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const IS_WIN = os.platform() === "win32";

const { env } = process;
export const HOME = os.homedir();
export const APPDATA = env.APPDATA || path.join(HOME, "AppData", "Roaming");

export const colors = {
  grn: kleur.green,
  gry: kleur.grey,
  blu: kleur.blue,
  red: kleur.red,
};

export const pkgInfo = createRequire(import.meta.dirname)(
  path.join(import.meta.dirname, "..", "package.json"),
);

export function getBinPath(cmd: string) {
  try {
    const result = subprocess
      .execSync(IS_WIN ? `where ${cmd}.cmd` : `which ${cmd}`)
      .toString()
      .split(/[\r\n]+/)
      .filter(Boolean)[0];
    if (result) return result.trim();
  } catch {
    throw Error(`Command not found: ${cmd}. Is it in PATH?`);
  }
}

export class YmlConfig {
  file: string;
  constructor(file: string) {
    this.file = path.resolve(file);
    this.assertFile();
  }
  assertFile() {
    const dir = path.dirname(this.file);
    if (!existsSync(dir)) mkdirSync(dir);
    if (!existsSync(this.file)) writeFileSync(this.file, "");
  }
  load() {
    this.assertFile();
    return yaml.load(readFileSync(this.file).toString()) || ({} as ConfRecord);
  }
  get(key: string) {
    const data = this.load() || {};
    function getConfigValue<T extends object>(key: string, node: T): unknown {
      return key.split(".").reduce<ConfValue>((c, k) => {
        return c && Object.hasOwn(c as object, k) ? (c as ConfRecord)[k] : null;
      }, node);
    }
    return getConfigValue(key, data) as ConfValue;
  }
  set(key: string, value: ConfValue) {
    const data = this.load() as ConfRecord;
    const keys = key.split(".");
    const lastKey = keys.pop();
    let node = data;

    for (const k of keys) {
      if (!node || !Object.hasOwn(node, k) || typeof node[k] !== "object") {
        node[k] = {};
      }
      node = node[k] as ConfRecord;
    }

    if (lastKey) node[lastKey] = value;
    this.save(data);
  }
  save(data: object) {
    this.assertFile();
    writeFileSync(`${this.file}.bak`, yaml.dump(this.load()));
    return writeFileSync(this.file, yaml.dump(data));
  }
}

export function toTitleCase(str: string) {
  return str.replace(
    /\w\S*/g,
    (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase(),
  );
}

export const promptToConfirm: PromptObject = {
  name: "confirm",
  type: "confirm",
  message: "Continue?",
  initial: true,
};
