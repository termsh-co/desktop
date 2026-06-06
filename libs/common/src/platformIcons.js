"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HOST_PLATFORM_ICONS = void 0;
exports.getHostPlatformIcon = getHostPlatformIcon;
const simple_icons_1 = require("simple-icons");
function fromSimpleIcon(icon, color) {
    return {
        title: icon.title,
        path: icon.path,
        color: color ?? `#${icon.hex}`,
    };
}
/** Microsoft Windows — Simple Icons’ta yok; resmi dört bölme logosu. */
const WINDOWS = {
    title: "Windows",
    color: "#0078D4",
    path: "M0 0h11v11H0V0zm13 0h11v11H13V0zM0 13h11v11H0V13zm13 0h11v11H13V13",
};
const UNKNOWN = {
    title: "Unknown",
    color: "var(--s-muted)",
    path: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zm-1.25 4.25h2.5v7.5h-2.5v-7.5z",
};
exports.HOST_PLATFORM_ICONS = {
    linux: fromSimpleIcon(simple_icons_1.siLinux),
    ubuntu: fromSimpleIcon(simple_icons_1.siUbuntu),
    debian: fromSimpleIcon(simple_icons_1.siDebian),
    centos: fromSimpleIcon(simple_icons_1.siCentos),
    fedora: fromSimpleIcon(simple_icons_1.siFedora),
    alpine: fromSimpleIcon(simple_icons_1.siAlpinelinux),
    arch: fromSimpleIcon(simple_icons_1.siArchlinux),
    windows: WINDOWS,
    macos: fromSimpleIcon(simple_icons_1.siApple, "#F5F5F7"),
    freebsd: fromSimpleIcon(simple_icons_1.siFreebsd),
    unknown: UNKNOWN,
};
function getHostPlatformIcon(platform) {
    return exports.HOST_PLATFORM_ICONS[platform] ?? exports.HOST_PLATFORM_ICONS.unknown;
}
//# sourceMappingURL=platformIcons.js.map