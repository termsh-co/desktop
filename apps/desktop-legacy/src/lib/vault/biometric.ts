import type { BiometricKind } from "@termsh/shared";

export function biometricIcon(kind: BiometricKind): "fingerprint" | "face" {
  return kind === "faceId" ? "face" : "fingerprint";
}

export function biometricLabelKey(kind: BiometricKind): string {
  switch (kind) {
    case "touchId":
      return "biometric.touchId";
    case "faceId":
      return "biometric.faceId";
    case "windowsHello":
      return "biometric.windowsHello";
    case "generic":
      return "biometric.generic";
    default:
      return "biometric.generic";
  }
}
