let native = null;

function loadNative() {
  if (native) return native;
  try {
    native = require("./native/termsh-core-napi.node");
    return native;
  } catch {
    return {
      coreVersion: () => "napi-not-built",
      vaultIsUnlockedPlaceholder: () => false,
    };
  }
}

function coreVersion() {
  return loadNative().coreVersion();
}

function vaultIsUnlockedPlaceholder() {
  return loadNative().vaultIsUnlockedPlaceholder();
}

module.exports = { coreVersion, vaultIsUnlockedPlaceholder };
