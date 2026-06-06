//! Biometric-protected master key storage (Touch ID / Face ID on macOS).

use base64::{engine::general_purpose::STANDARD, Engine};
use serde::Serialize;

use crate::error::{AppError, AppResult};

const BIOMETRIC_SERVICE: &str = "app.termsh.desktop.biometric";
const ACCOUNT: &str = "vault-master-key";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum BiometricKind {
    None,
    TouchId,
    FaceId,
    WindowsHello,
    Generic,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BiometricStatus {
    pub available: bool,
    pub enabled: bool,
    pub kind: BiometricKind,
}

#[cfg(target_os = "macos")]
mod platform {
    use super::*;
    use core_foundation::base::{CFType, TCFType};
    use core_foundation::boolean::CFBoolean;
    use core_foundation::dictionary::CFMutableDictionary;
    use core_foundation::number::CFNumber;
    use core_foundation::string::CFString;
    use core_foundation_sys::base::CFRelease;
    use objc2_local_authentication::{LABiometryType, LAContext, LAPolicy};
    use security_framework::passwords::{
        delete_generic_password_options, generic_password, set_generic_password_options,
        AccessControlOptions, PasswordOptions,
    };
    use security_framework_sys::item::{
        kSecAttrAccount, kSecAttrService, kSecClass, kSecClassGenericPassword, kSecMatchLimit,
        kSecReturnAttributes, kSecUseAuthenticationUI,
    };
    use security_framework_sys::keychain_item::SecItemCopyMatching;

    const ERR_SEC_INTERACTION_NOT_ALLOWED: i32 = -25_308;

    pub fn detect_kind() -> BiometricKind {
        let context = unsafe { LAContext::new() };
        let policy = LAPolicy::DeviceOwnerAuthenticationWithBiometrics;
        if unsafe { context.canEvaluatePolicy_error(policy) }.is_err() {
            return BiometricKind::None;
        }
        match unsafe { context.biometryType() } {
            LABiometryType::TouchID => BiometricKind::TouchId,
            LABiometryType::FaceID => BiometricKind::FaceId,
            LABiometryType::OpticID => BiometricKind::Generic,
            _ => BiometricKind::Generic,
        }
    }

    pub fn is_available() -> bool {
        detect_kind() != BiometricKind::None
    }

    fn entry_exists() -> bool {
        unsafe {
            let class_key = CFString::wrap_under_get_rule(kSecClass);
            let class_val = CFString::wrap_under_get_rule(kSecClassGenericPassword);
            let service_key = CFString::wrap_under_get_rule(kSecAttrService);
            let service_val = CFString::from(BIOMETRIC_SERVICE);
            let account_key = CFString::wrap_under_get_rule(kSecAttrAccount);
            let account_val = CFString::from(ACCOUNT);
            let return_key = CFString::wrap_under_get_rule(kSecReturnAttributes);
            let return_val = CFBoolean::true_value();
            let limit_key = CFString::wrap_under_get_rule(kSecMatchLimit);
            let limit_val = CFNumber::from(1_i32);
            let auth_ui_key = CFString::wrap_under_get_rule(kSecUseAuthenticationUI);
            let auth_ui_val = CFString::from("fail");

            let mut query: CFMutableDictionary<CFString, CFType> = CFMutableDictionary::new();
            query.add(&class_key, &class_val.as_CFType());
            query.add(&service_key, &service_val.as_CFType());
            query.add(&account_key, &account_val.as_CFType());
            query.add(&return_key, &return_val.as_CFType());
            query.add(&limit_key, &limit_val.as_CFType());
            query.add(&auth_ui_key, &auth_ui_val.as_CFType());

            let mut result: core_foundation_sys::base::CFTypeRef = std::ptr::null();
            let status = SecItemCopyMatching(query.as_concrete_TypeRef(), &mut result);
            if !result.is_null() {
                CFRelease(result);
            }
            status == 0 || status == ERR_SEC_INTERACTION_NOT_ALLOWED
        }
    }

    pub fn is_enabled() -> bool {
        is_available() && entry_exists()
    }

    pub fn store_master_key(key: &[u8; 32]) -> AppResult<()> {
        let encoded = STANDARD.encode(key);
        let mut options = PasswordOptions::new_generic_password(BIOMETRIC_SERVICE, ACCOUNT);
        options.set_access_control_options(
            AccessControlOptions::BIOMETRY_CURRENT_SET | AccessControlOptions::USER_PRESENCE,
        );
        set_generic_password_options(encoded.as_bytes(), options)
            .map_err(|e| AppError::keychain_write_failed(e.to_string()))
    }

    pub fn load_master_key() -> AppResult<[u8; 32]> {
        let options = PasswordOptions::new_generic_password(BIOMETRIC_SERVICE, ACCOUNT);
        let bytes = generic_password(options)
            .map_err(|e| AppError::keychain_read_failed(e.to_string()))?;
        decode_master_key(&bytes)
    }

    pub fn clear_master_key() -> AppResult<()> {
        let options = PasswordOptions::new_generic_password(BIOMETRIC_SERVICE, ACCOUNT);
        match delete_generic_password_options(options) {
            Ok(()) => Ok(()),
            Err(e) if e.code() == security_framework_sys::base::errSecItemNotFound => Ok(()),
            Err(e) => Err(AppError::keychain_delete_failed(e.to_string())),
        }
    }
}

#[cfg(not(target_os = "macos"))]
mod platform {
    use super::*;

    pub fn detect_kind() -> BiometricKind {
        BiometricKind::None
    }

    pub fn is_available() -> bool {
        false
    }

    pub fn is_enabled() -> bool {
        false
    }

    pub fn store_master_key(_key: &[u8; 32]) -> AppResult<()> {
        Err(AppError::biometric_unavailable())
    }

    pub fn load_master_key() -> AppResult<[u8; 32]> {
        Err(AppError::biometric_unavailable())
    }

    pub fn clear_master_key() -> AppResult<()> {
        Ok(())
    }
}

fn decode_master_key(bytes: &[u8]) -> AppResult<[u8; 32]> {
    let decoded = STANDARD
        .decode(String::from_utf8_lossy(bytes).trim())
        .map_err(|e| AppError::keychain_corrupt(e.to_string()))?;
    decoded
        .try_into()
        .map_err(|_| AppError::vault_invalid_key())
}

pub fn status() -> BiometricStatus {
    let kind = platform::detect_kind();
    BiometricStatus {
        available: platform::is_available(),
        enabled: platform::is_enabled(),
        kind,
    }
}

pub fn is_available() -> bool {
    platform::is_available()
}

pub fn is_enabled() -> bool {
    platform::is_enabled()
}

pub fn store_master_key(key: &[u8; 32]) -> AppResult<()> {
    platform::store_master_key(key)
}

pub fn load_master_key() -> AppResult<[u8; 32]> {
    platform::load_master_key()
}

pub fn clear_master_key() -> AppResult<()> {
    platform::clear_master_key()
}
