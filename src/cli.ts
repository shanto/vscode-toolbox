#!/usr/bin/env node

import path from "node:path";

import { program } from "commander";
import prompts from "prompts";

import { titleCase } from "title-case";

import yaml from "js-yaml";

import { VSCodeFlavor } from "./vscode.ts";
import {
  HOME,
  YmlConfig,
  pkgInfo,
  promptToConfirm as promptConfirm,
  colors,
} from "./utils.ts";
const { version, name: command, homepage } = pkgInfo;
const dotName = Object.keys(pkgInfo.bin).shift();

const config = new YmlConfig(path.join(HOME, `.${dotName}`, "config.yml"));

let variant: VSCodeFlavor;

program
  .name(`npx ${command}`)
  .option(
    "-v, --variant <ide-cmd>",
    "VS Code product variant to operate on\ne.g. code, windsurf, cursor, kiro",
    "code",
  )
  .option(
    "-p, --profile <profile-name>",
    "Profile to operate on. If not specified, assumes Default",
  )
  .option(
    "-a, --auto",
    "Enable auto mode for scripted operations. No prompts or confirmations",
  )
  .hook("preSubcommand", async (thisCommand) => {
    const opts = thisCommand.optsWithGlobals();
    variant = new VSCodeFlavor(opts.variant);
    const name = opts.profile;
    const { red } = colors;
    const profile = variant.findProfile("name", name);
    if (profile === null && !!name) {
      const { confirm } = opts.auto
        ? { confirm: true }
        : await prompts(
            promptConfirm(
              `Profile named ${red(name)} does not exist. Create new?`,
            ),
          );
      if (!confirm) process.exit(0);
      variant.createProfile(name);
    }
  })
  .configureHelp({ showGlobalOptions: true })
  .addHelpText(
    "after",
    `
Config:  ${config.file}
${colors.blu(command)} ${version} | ${homepage}
`,
  );
program
  .command("inspect")
  .alias("summary")
  .description(
    "Summarize extensions installed per profile as YAML dump\ne.g. inspect -v cursor",
  )
  .action(() => {
    const { grn, blu } = colors;
    console.log(
      yaml
        .dump(variant.summary)
        .replaceAll(/(:)([\r\n]+)/g, (m, t1, t2) => `${blu(t1)}${t2}`)
        .replaceAll(/(-)(\s+)/g, (m, t1, t2) => `${grn(t1)}${t2}`),
    );
  });
program
  .command("install")
  .argument(
    "<extensions...>",
    "Extension IDs separated by spaces e.g. esbenp.prettier-vscode github.github-vscode-theme",
  )
  .option("-g, --global", "Operate on Default profile and mark items as global")
  .description(
    "Install one or more extensions globally or into a profile\ne.g. install vendorA.extX vendorB.extY -v windsurf -p Node",
  )
  .action(async function () {
    const { blu, grn } = colors;
    const exts = this.args;
    const profile = this.optsWithGlobals().profile;
    const global_label = this.opts().global ? " [Global]" : "";
    console.log(
      `Installing (${grn(exts.length)}) extensions into ${blu(variant.brand)} [${profile || "Default"}${global_label}]: ${grn(exts.join(", "))}`,
    );
    const { confirm } = this.optsWithGlobals().auto
      ? { confirm: true }
      : await prompts(promptConfirm());
    if (!confirm) return;
    variant.installExtensions(exts, profile, this.opts().global);
  });
program
  .command("save-globals")
  .alias("sg")
  .description("Save globally activated extensions from Default profile")
  .action(async function () {
    const { grn, blu } = colors;
    const globals = variant.globalExtensionIDs;
    console.log(
      `Saving extensions from ${blu(variant.brand)} [Global]: ${grn(globals.join(", "))}`,
    );
    const { confirm } = this.optsWithGlobals().auto
      ? { confirm: true }
      : await prompts(promptConfirm());
    if (!confirm) return;
    config.set("globals", globals);
    console.log(grn("Saved!"));
  });
program
  .command("uninstall-globals")
  .alias("ug")
  .description(`Uninstall all global extensions from Default profile`)
  .action(async function () {
    const { grn, blu } = colors;
    const globals = variant.globalExtensionIDs;
    console.log(
      `Uninstalling all from ${blu(variant.brand)} [Global]: ${grn(globals.join(", "))}`,
    );
    const { confirm } = this.optsWithGlobals().auto
      ? { confirm: true }
      : await prompts(promptConfirm());
    if (!confirm) return;
    variant.uninstallExtensions(globals);
    console.log(grn("Clear!"));
  });
program
  .command("restore-globals")
  .alias("rg")
  .description(
    "Restore saved global extensions into Default profile \n(config.yml → globals)",
  )
  .action(async function () {
    const { grn, blu } = colors;
    const globals = config.get("globals") as string[];
    console.log(
      `Installing extensions from config into ${blu(variant.brand)} [Global]: ${grn(globals.join(", "))}`,
    );
    const { confirm } = this.optsWithGlobals().auto
      ? { confirm: true }
      : await prompts(promptConfirm());
    if (!confirm) return;
    variant.installGlobalExtensions(globals);
    console.log(grn("Done!"));
  });
program
  .command("save-to-bucket <bucket-name>")
  .alias("sb")
  .description("Save extensions from a profile to a bucket")
  .action(async function () {
    const { grn, blu } = colors;
    const bucket = this.args[0];
    const profile = variant.findProfile("name", this.optsWithGlobals().profile);
    const exts = profile?.extensions ? profile.extensions.map((e) => e.id) : [];
    if (!profile) return;
    console.log(
      `Saving extensions from ${blu(variant.brand)} profile ${blu(profile.name)} to bucket ${blu(bucket)}: ${grn(exts.join(", "))}`,
    );
    const { confirm } = this.optsWithGlobals().auto
      ? { confirm: true }
      : await prompts(promptConfirm());
    if (!confirm) return;
    config.set(`buckets.${bucket}`, exts);
  });
program
  .command("restore-bucket [bucket-name]")
  .alias("rb")
  .description(
    "Restore extensions from a saved bucket into given profile \n(config.yml → buckets → <key>)",
  )
  .action(async function () {
    const { grn, blu } = colors;
    const profile = variant.findProfile("name", this.optsWithGlobals().profile);
    const buckets = config.get("buckets") as ConfRecord;
    if (Object.keys(buckets).length < 1) {
      console.error("No bucket found in config");
      return;
    }
    const { bucket } =
      this.args[0] && Object.hasOwn(buckets, this.args[0])
        ? { bucket: this.args[0] }
        : await prompts({
            name: "bucket",
            type: "select",
            choices: () => {
              return Object.keys(buckets).map((b) => {
                return {
                  title: b,
                  value: b,
                  description: (buckets[b] as string[]).join(", "),
                };
              });
            },
            message: "Pick a bucket",
          });
    if (!bucket) return;
    const exts = config.get(`buckets.${bucket}`) as [];
    console.log(
      `Restoring extensions from bucket ${grn(bucket)} to ${blu(variant.brand)} [${profile?.name || "Default"}]: ${grn(exts.join(", "))}`,
    );
    const { confirm } = this.optsWithGlobals().auto
      ? { confirm: true }
      : await prompts(promptConfirm());
    if (!confirm) return;
    variant.installExtensions(exts, profile?.name);
    console.log(grn("Done!"));
  });

program
  .command("list-extensions")
  .alias("extensions")
  .alias("le")
  .description(`List extensions from default or selected profile (-p <name>)`)
  .action(async function () {
    const profile = variant.findProfile("name", this.optsWithGlobals().profile);
    const extensions =
      (profile && profile.extensions) || variant.defaultExtensions;
    console.log(extensions.map((x: ExtensionMeta) => x.id).join(" "));
  });

program
  .command("uninstall-extensions")
  .alias("ue")
  .argument(
    "<extensions...>",
    "Extension IDs separated by spaces e.g. esbenp.prettier-vscode github.github-vscode-theme",
  )
  .description(
    `Uninstall extensions from default or selected profile (-p <name>)`,
  )
  .action(async function () {
    const profile = variant.findProfile("name", this.optsWithGlobals().profile);
    const exts = this.args;
    const { blu, grn } = colors;
    console.log(
      `Uninstalling extensions from ${blu(variant.brand)} [${profile?.name || "Default"}]: ${grn(exts.join(", "))}`,
    );
    const { confirm } = this.optsWithGlobals().auto
      ? { confirm: true }
      : await prompts(promptConfirm());
    if (!confirm) return;
    variant.uninstallExtensions(exts, profile?.name);
  });

program
  .command("create-profile <name>")
  .alias("profile")
  .alias("cp")
  .description(`Create profile with the given name`)
  .action(async function () {
    const name = titleCase(this.args[0]);
    const { blu } = colors;
    console.log(`Creating new profile in ${blu(variant.brand)}: ${name}`);
    const { confirm } = this.optsWithGlobals().auto
      ? { confirm: true }
      : await prompts(promptConfirm());
    if (!confirm) return;
    variant.createProfile(name);
  });

program
  .command("dump-config")
  .alias("conf")
  .alias("dc")
  .description(`Dump contents of config\n(${config.file})`)
  .action(async function () {
    console.log(yaml.dump(config.load()));
  });

program.parseAsync().then(() => {});
