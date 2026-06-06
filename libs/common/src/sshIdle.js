"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSH_IDLE_TIMEOUT_VALUES = void 0;
exports.isSshIdleTimeout = isSshIdleTimeout;
exports.sshIdleTimeoutMs = sshIdleTimeoutMs;
exports.SSH_IDLE_TIMEOUT_VALUES = [0, 15, 30, 60, 120];
function isSshIdleTimeout(value) {
    return exports.SSH_IDLE_TIMEOUT_VALUES.includes(value);
}
function sshIdleTimeoutMs(minutes) {
    return minutes * 60 * 1000;
}
//# sourceMappingURL=sshIdle.js.map