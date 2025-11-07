declare enum TargetPlatform {
  WIN32_X64 = "win32-x64",
  WIN32_ARM64 = "win32-arm64",

  LINUX_X64 = "linux-x64",
  LINUX_ARM64 = "linux-arm64",
  LINUX_ARMHF = "linux-armhf",

  ALPINE_X64 = "alpine-x64",
  ALPINE_ARM64 = "alpine-arm64",

  DARWIN_X64 = "darwin-x64",
  DARWIN_ARM64 = "darwin-arm64",

  WEB = "web",

  UNIVERSAL = "universal",
  UNKNOWN = "unknown",
  UNDEFINED = "undefined",
}

type InstallSource = "gallery" | "local";

interface IGalleryMetadata {
  id: string;
  publisherId: string;
  private: boolean;
  publisherDisplayName: string;
  isPreReleaseVersion: boolean;
  targetPlatform?: TargetPlatform;
}

declare type Metadata = Partial<
  IGalleryMetadata & {
    isApplicationScoped: boolean;
    isMachineScoped: boolean;
    isBuiltin: boolean;
    isSystem: boolean;
    updated: boolean;
    preRelease: boolean;
    hasPreReleaseVersion: boolean;
    installedTimestamp: number;
    pinned: boolean;
    source: InstallSource;
    size: number;
  }
>;

declare type URI = {
  scheme: string;
  authority?: string;
  path?: string;
  query?: string;
  fragment?: string;
  location: string;
  $mid: string;
};

declare type ExtensionIdentifier = {
  id: string;
  uuid?: string;
};

declare type ExtensionMeta = {
  readonly identifier: ExtensionIdentifier;
  readonly version: string;
  readonly location: URI;
  readonly metadata?: Metadata;
  get id(): string;
};

declare enum ProfileResourceType {
  Settings = "settings",
  Keybindings = "keybindings",
  Snippets = "snippets",
  Prompts = "prompts",
  Tasks = "tasks",
  Extensions = "extensions",
  GlobalState = "globalState",
  Mcp = "mcp",
}
declare type UseDefaultProfileFlags = {
  [key in ProfileResourceType]?: boolean;
};
declare type ProfileResourceTypeFlags = UseDefaultProfileFlags;

declare type UserProfile = {
  readonly id: string;
  readonly isDefault: boolean;
  readonly name: string;
  readonly icon?: string;
  readonly location: string;
  readonly globalStorageHome: URI;
  readonly settingsResource: URI;
  readonly keybindingsResource: URI;
  readonly tasksResource: URI;
  readonly snippetsHome: URI;
  readonly promptsHome: URI;
  readonly extensionsResource: URI;
  readonly mcpResource: URI;
  readonly cacheHome: URI;
  readonly useDefaultFlags?: UseDefaultProfileFlags;
  readonly isTransient?: boolean;
  readonly workspaces?: readonly URI[];
};

declare type UserProfileEx = UserProfile & { extensions: ExtensionMeta[] };
