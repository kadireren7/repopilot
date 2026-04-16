"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRemoteRepositoryUrl = isRemoteRepositoryUrl;
function isRemoteRepositoryUrl(target) {
    const t = target.trim();
    return t.startsWith("http://") || t.startsWith("https://") || t.startsWith("git@");
}
