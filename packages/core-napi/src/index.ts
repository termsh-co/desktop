export type CoreNapiModule = {
  coreVersion: () => string;
  vaultIsUnlockedPlaceholder: () => boolean;
};

let native: CoreNapiModule | null = null;

function loadNative(): CoreNapiModule {
  if (native) return native;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    native = require("../native/termsh-core-napi.node") as CoreNapiModule;
    return native;
  } catch {
    return {
      coreVersion: () => "napi-not-built",
      vaultIsUnlockedPlaceholder: () => false,
    };
  }
}

export function coreVersion(): string {
  return loadNative().coreVersion();
}

export function vaultIsUnlockedPlaceholder(): boolean {
  return loadNative().vaultIsUnlockedPlaceholder();
}
