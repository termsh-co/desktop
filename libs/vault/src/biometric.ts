import type { BiometricKind } from "@termsh/common";

export function biometricIcon(kind: BiometricKind): "fingerprint" | "face" {
  return kind === "faceId" ? "face" : "fingerprint";
}

export function biometricLabelKey(kind: BiometricKind): string {
  switch (kind) {
    case "touchId":
      return "vault.biometric.touchId";
    case "faceId":
      return "vault.biometric.faceId";
    case "windowsHello":
      return "vault.biometric.windowsHello";
    case "generic":
      return "vault.biometric.generic";
    default:
      return "vault.biometric.generic";
  }
}
