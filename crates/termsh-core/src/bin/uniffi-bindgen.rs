#[cfg(feature = "uniffi")]
fn main() {
    uniffi::uniffi_bindgen_main()
}

#[cfg(not(feature = "uniffi"))]
fn main() {
    eprintln!("Build with --features uniffi");
    std::process::exit(1);
}
