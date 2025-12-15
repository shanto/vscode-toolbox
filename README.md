# What?

A CLI program to **manage exetensions in VS Code and derivative IDE products**. E.g. windsurf, cursor, kiro and maybe others.

## Features

- [x] Operate on any VS Code based IDE. Pass `-v|--variant` option to select the target IDE.
- [x] Install or uninstall extensions to and from specified profile of an IDE.
- [x] Extract and save extensions from a particular IDE profile or global scope into a named bucket.
- [x] Restore extensions from a bucket into a given profile in an IDE. Buckets are stored in editable YAML (config.yml).
- [x] List extensions from one profile and inject into another, across IDEs. Use xargs.
- [x] Does not require IDEs to be closed or restarted for most operations.
- [x] Auto mode for unattended/scripted execution. When auto mode is not activated, most operations are confirmed with terminal prompts.
- [x] Create target profile if missing.
- [ ] Fillter out or ignore extensions/wildcards during operations.
- [ ] Auto-detect binary paths for non-standard or portable installations. Already does for standard (system+user) paths.

# Why?

1. With the increasing number of IDE products based on VS Code, management of extensions and profiles becomes a tedious job as there is no mass management feature built into VS Code.
2. Not all VS Code based IDE products come with Cloud Sync feature. What if we want to sync extensions under the same IDE between a PC and a Laptop?
2. Profiles cannot be extended or composed. What if we want to compose a profile out of two profiles, e.g. combine PHP profile and Node profile for WordPress development?

# How?

This program directly operates (read) on the config storage maintained by relevant IDE products. For installing or removing extensions, CLI program of the corresponding IDE is used. Configuration file for this program is stored as an editable YAML file.

```
＄ npx vscode-toolbox --help
Usage: npx vscode-toolbox [options] [command]

Options:
  -v, --variant <ide-cmd>                  VS Code product variant to operate on
                                           e.g. code, windsurf, cursor, kiro (default: "code")
  -p, --profile <profile-name>             Profile to operate on. If not specified, assumes Default
  -a, --auto                               Enable auto mode for scripted operations. No prompts or confirmations
  -h, --help                               display help for command

Commands:
  inspect|summary                          Summarize extensions installed per profile as YAML dump
                                           e.g. inspect -v cursor
  install|ie [options] <extensions...>     Install one or more extensions globally or into a profile
                                           e.g. install vendorA.extX vendorB.extY -v windsurf -p Node
  save-globals|sg                          Save globally activated extensions from Default profile
  uninstall-globals|ug                     Uninstall all global extensions from Default profile
  restore-globals|rg                       Restore saved global extensions into Default profile
                                           (config.yml → globals)
  save-to-bucket|sb <bucket-name>          Save extensions from a profile to a bucket
  restore-bucket|rb [bucket-name]          Restore extensions from a saved bucket into given profile
                                           (config.yml → buckets → <key>)
  list-extensions|extensions               List extensions from default or selected profile (-p <name>)
  uninstall-extensions|ue <extensions...>  Uninstall extensions from default or selected profile (-p <name>)
  create-profile|profile <name>            Create profile with the given name
  dump-config|conf                         Dump contents of config
                                           (C:\Users\Shaan\.vscode-toolbox\config.yml)
  help [command]                           display help for command

Config:  C:\Users\Shaan\.vscode-toolbox\config.yml
vscode-toolbox 1.1.3 | https://github.com/shanto/vscode-toolbox
```

```
＄ npx vscode-toolbox -v kiro inspect
product: Kiro v0.7.45
binary: C:\Users\Shaan\AppData\Local\Programs\Kiro\bin\kiro.cmd
data: C:\Users\Shaan\AppData\Roaming\kiro\User
extensions: C:\Users\Shaan\.kiro\extensions\extensions.json
profiles:
  - name: Default
    extensions: []
    globals:
      - beardedbear.beardedtheme
      - github.github-vscode-theme
      - prateekmahendrakar.prettyxml
      - esbenp.prettier-vscode
  - name: SomeProfile
    extensions:
      - extension.id.1
      - extension.id.2
```

```
＄ cat C:\Users\Shaan\.vscode-toolbox\config.yml
globals:
  - github.github-vscode-theme
  - esbenp.prettier-vscode
  - gruntfuggly.todo-tree
  - usernamehw.errorlens
  - tamasfe.even-better-toml
  - redhat.vscode-xml
  - anweber.vscode-httpyac
  - streetsidesoftware.code-spell-checker
  - prateekmahendrakar.prettyxml
  - redhat.vscode-yaml
  - danielroedl.meld-diff
  - hverlin.mise-vscode
buckets:
  php:
    - devsense.intelli-php-vscode
    - devsense.composer-php-vscode
    - devsense.profiler-php-vscode
    - devsense.phptools-vscode
    - stoildobreff.php-resolver
  node:
    - biomejs.biome
    - steoates.autoimport
    - connor4312.esbuild-problem-matchers
```
```
# Compose a profile out of two buckets

＄ npx vscode-toolbox -v kiro -p WordPress rb php
Restoring extensions from bucket php to Kiro [WordPress]: devsense.intelli-php-vscode, devsense.composer-php-vscode, devsense.profiler-php-vscode, devsense.phptools-vscode, stoildobreff.php-resolver
√ Continue? ... no

＄ npx vscode-toolbox -v kiro -p WordPress rb node
Restoring extensions from bucket node to Kiro [WordPress]: biomejs.biome, steoates.autoimport, connor4312.esbuild-problem-matchers
√ Continue? ... no
```

# Tips & Tricks

Use `xargs` from Git-Bash to pipe outputs from one command to another command. E.g. to transfer VS Code (code.exe) extensions from profile Node to Kiro:
```
npx vscode-toolbox -v code -p Node -a get-extensions | xargs npx vscode-toolbox -v kiro -p Node -a install
```
`-a | --auto` is for skipping prompts and confirmations.
