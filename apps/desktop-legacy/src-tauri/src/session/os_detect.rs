/// SSH sunucu banner'ından işletim sistemi tahmini.
pub fn detect_platform_from_banner(banner: &str) -> Option<&'static str> {
    let b = banner.to_lowercase();

    if b.contains("ubuntu") {
        return Some("ubuntu");
    }
    if b.contains("debian") {
        return Some("debian");
    }
    if b.contains("centos")
        || b.contains("rocky")
        || b.contains("alma")
        || b.contains("red hat")
        || b.contains("rhel")
    {
        return Some("centos");
    }
    if b.contains("fedora") {
        return Some("fedora");
    }
    if b.contains("alpine") {
        return Some("alpine");
    }
    if b.contains("arch") {
        return Some("arch");
    }
    if b.contains("freebsd") {
        return Some("freebsd");
    }
    if b.contains("darwin") {
        return Some("macos");
    }
    if b.contains("windows") {
        return Some("windows");
    }
    if b.contains("linux") || b.contains("openssh") {
        return Some("linux");
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_ubuntu_banner() {
        let p = detect_platform_from_banner("SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.6");
        assert_eq!(p, Some("ubuntu"));
    }
}
