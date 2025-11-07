# What?

A CLI program to **manage VS Code and derivative IDE products**. E.g. windsurf, cursor, kiro and maybe others.

## Features

- [x] Operate on any VS Code based IDE. Pass `-v|--variant` option to select the target IDE.
- [x] Extract and save extensions from a particular IDE profile or global scope into a named bucket.
- [x] Restore extensions from a bucket into a given profile in any IDE. Buckets are stored in editable YAML (config.yml).
- [x] List extensions from one profile and inject into another, across IDEs.
- [x] Does not require IDEs to be closed or restarted for most operations.
- [ ] Full scripted operation support. (IN PROGRESS)
- [ ] Fillter out or ignore extensions/wildcards during operations.
- [ ] Auto-detect binary paths for non-standard or portable installations.
- [ ] Create target profile if missing.

# Why?

With the increasing number of IDE products based on VS Code, management of extensions and profiles becomes a tedious job as there is no mass management feature built into VS Code. It is possible to enable or disable ALL extensions at once, but exporting or importing the list of extensions has never been an option. Moreover, not all IDEs come with cloud sync feature.

# How?

This program directly operates (read) on the config storage maintained by relevant IDE products. For installing or removing extensions, CLI program of the corresponding IDE is used. Configuration file for this program is stored as an editable YAML file.

```
Usage: npx vscode-toolbox [options] [command]

Options:
  -v, --variant <cmd>                VS Code product variant to operate on
                                     e.g. code, windsurf, cursor, kiro (default: "code")
  -p, --profile <profile-name>       Profile to operate on. If not specified, assumes Default
  -a, --auto                         Enable auto mode for scripted operations. No prompts or confirmation
  -h, --help                         display help for command

Commands:
  inspect|summary                    Summarize extensions installed per profile as YAML dump
                                     e.g. inspect -v cursor
  install [options] <extensions...>  Install one or more extensions globally or into a profile
                                     e.g. install vendorA.extX vendorB.extY -v windsurf -p Node
  save-globals|sg                    Save globally activated extensions from Default profile
  uninstall-globals|ug               Uninstall all global extensions from Default profile
  restore-globals|rg                 Restore saved global extensions into Default profile
                                     (config.yml → globals)
  save-to-bucket|sb <bucket-name>    Save extensions from a profile to a bucket
  restore-bucket|rb                  Restore extensions from a saved bucket into given profile
                                     (config.yml → buckets → <key>)
  help [command]                     display help for command

Config:
  C:\Users\JohnDoe\.vscode-toolbox\config.yml
```

# Tips & Tricks

Use `xargs` from Git-Bash to pipe outputs from one command to another command. E.g.
```
<program> -a -p Node -v code get-extensions | xargs <program> -a -p Node -v code install
```
`-a | --auto` is for skipping prompts and confirmations.
