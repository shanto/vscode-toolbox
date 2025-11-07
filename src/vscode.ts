import { readFileSync, writeFileSync } from "node:fs";
import subprocess from "node:child_process";
import path from "node:path";
import { getBinPath, toTitleCase } from "./utils.ts";
import { APPDATA, HOME, colors } from "./utils.ts";

export class VSCodeFlavor {
  name: string;
  brand: string;
  binary: string;
  clijs: string;
  meta: { dot: string; brand: string };

  META: Record<string, any> = {
    code: {
      dot: "vscode",
      brand: "VS Code",
    },
  };

  constructor(name: string, binary?: string) {
    this.name = name;
    this.binary = binary || getBinPath(name) || name;
    this.clijs = path.resolve(
      this.binary,
      path.join("..", ".."),
      path.join("resources", "app", "out", "cli.js"),
    );
    this.meta = Object.hasOwn(this.META, name)
      ? this.META[name]
      : { dot: name, brand: toTitleCase(name) };
    this.brand = this.meta.brand;
  }

  exec(cmd: string) {
    return subprocess
      .execSync(`node "${this.clijs}" ${cmd}`)
      .toString()
      .split(/[\r\n]+/)
      .filter(Boolean);
  }

  get version() {
    return this.exec("--version")[0];
  }

  get dataPath() {
    return path.join(APPDATA, this.name, "User");
  }

  get globalStoragePath() {
    return path.join(this.dataPath, "globalStorage", "storage.json");
  }

  get extensionStoragePath() {
    const dotFolder = this.meta?.dot || this.name;
    return path.join(HOME, `.${dotFolder}`, "extensions", "extensions.json");
  }

  get globalStorage() {
    return JSON.parse(readFileSync(this.globalStoragePath).toString());
  }

  static extensionMutator(e: ExtensionMeta) {
    return {
      ...e,
      get id(): string {
        return this.identifier.id;
      },
    };
  }

  get extensionStorage() {
    try {
      return JSON.parse(readFileSync(this.extensionStoragePath).toString()).map(
        VSCodeFlavor.extensionMutator,
      );
    } catch (error) {
      console.debug(error);
      return [];
    }
  }

  get globalExtensions() {
    const extensions = this.extensionStorage;
    return extensions.filter(
      (item: ExtensionMeta) => item.metadata?.isApplicationScoped,
    );
  }

  get globalExtensionIDs() {
    return this.globalExtensions.map((ext: ExtensionMeta) => ext.id);
  }

  get defaultExtensions() {
    const extensions = this.extensionStorage;
    return extensions.filter(
      (item: ExtensionMeta) => !item.metadata?.isApplicationScoped,
    );
  }

  get profiles(): UserProfileEx[] {
    return this.globalStorage.userDataProfiles.map((profile: UserProfileEx) => {
      const this_path = path.join(
        this.dataPath,
        "profiles",
        profile.location as string,
      );
      return {
        ...profile,
        path: this_path,
        extensions: (() => {
          try {
            return JSON.parse(
              readFileSync(path.join(this_path, "extensions.json")).toString(),
            ).map(VSCodeFlavor.extensionMutator);
          } catch {
            return [];
          }
        })(),
      } as UserProfileEx;
    });
  }

  findProfile(key: string, val: string) {
    function lower(s: string | unknown) {
      return typeof s === "string" ? s.toLowerCase() : s;
    }
    const ret = this.profiles.filter(
      (p: Record<string, any>) => lower(p[key]) === lower(val),
    );
    return ret.length ? (ret.shift() as UserProfileEx) : null;
  }

  get defaultProfile() {
    return {
      name: "Default",
      extensions: this.defaultExtensions.map((e: ExtensionMeta) => e.id),
    } as UserProfileEx;
  }

  get summary() {
    const profiles = [
      {
        ...this.defaultProfile,
        globals: this.globalExtensionIDs,
      },
      ...this.profiles.map((p: UserProfileEx) => {
        return {
          name: p.name,
          extensions: p.extensions?.map((e: ExtensionMeta) => e.id),
        };
      }),
    ];
    const summary = {
      brand: this.brand,
      binary: this.binary,
      data: this.dataPath,
      extensions: this.extensionStoragePath,
      profiles: profiles,
    };
    return summary;
  }

  setExtensionMeta(
    id: string,
    key: keyof Metadata,
    value: Metadata[keyof Metadata],
  ) {
    function matchId(ext: ExtensionMeta) {
      return ext.identifier.id === id;
    }
    const all = this.extensionStorage;
    const that = this.extensionStorage.filter(matchId);
    if (that.length !== 1) {
      throw Error(`Invalid state for: ${id}. Found ${that.length} instances.`);
    }
    const idx = all.findIndex(matchId);
    // console.debug(`Setting ${key}=${value} for ${id}`);
    if (!Object.hasOwn(all[idx], "metadata")) all[idx].metadata = {};
    all[idx].metadata[key] = value;
    writeFileSync(this.extensionStoragePath, JSON.stringify(all));
  }

  installGlobalExtensions(exts: string[]) {
    const { grn } = colors;
    exts.map((ext) => {
      console.log(`Installing ${grn(ext)}...`);
      return this.installExtension(ext, "Default", true);
    });
  }

  installExtension(
    id: string,
    profile: UserProfile["name"] = "Default",
    global: boolean = false,
  ) {
    let res: string[] = [];
    try {
      res = this.exec(`--install-extension "${id}" --profile "${profile}"`);
    } catch (e) {
      if (!(e as Error).message.match(/not found/)) throw e;
    }
    if (global && profile !== "Default")
      throw Error("Cannot set global inside non-Default profile");
    if (global && res.length)
      this.setExtensionMeta(id, "isApplicationScoped", true);
  }

  installExtensions(
    extensions: string[],
    profile: UserProfile["name"] = "Default",
    global: boolean = false,
  ) {
    extensions.map((id) => {
      return this.installExtension(id, profile, global);
    });
  }

  uninstallExtension(id: string, profile: UserProfileEx["name"] = "Default") {
    try {
      return this.exec(`--uninstall-extension "${id}" --profile "${profile}"`);
    } catch {
      return false;
    }
  }

  uninstallExtensions(
    extensions: string[],
    profile: UserProfileEx["name"] | "*" | UserProfileEx = "Default",
  ) {
    let profiles: string[];
    if (typeof profile === "string" && profile.toLowerCase() === "*") {
      profiles = this.profiles.map((p) => p.name);
    } else {
      profiles = [typeof profile === "string" ? profile : profile.name];
    }
    if (profiles.length === 1)
      console.log(`Operating on ${profiles[0]} profile...`);
    else console.log(`Operating on profiles: ${profiles.join(", ")}`);
    profiles.map((profile) => {
      return extensions.map((id: string) => {
        return this.uninstallExtension(id, profile);
      });
    });
  }
}
