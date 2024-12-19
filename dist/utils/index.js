"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHash = void 0;
exports.findNamespace = findNamespace;
exports.getParentBranch = getParentBranch;
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
function findNamespace(path, namespaces) {
    // console.log('Searching namespace for '+ path);
    return Object.keys(namespaces).find((n) => {
        return namespaces[n][0].includes(path);
    });
}
function getParentBranch(branchName) {
    return ((0, child_process_1.execSync)('git show-branch -a |  grep \'\\*\' | grep -v "' +
        branchName +
        '" | head -n1 | sed \'s/.*\\[\\(.*\\)\\].*/\\1/\' | sed \'s/[\\^~].*//\'', {}))
        .toString('utf-8')
        .replace(/\n/g, '');
}
const getHash = (path) => new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const rs = fs.createReadStream(path);
    rs.on('error', reject);
    rs.on('data', (chunk) => hash.update(chunk));
    rs.on('end', () => resolve(hash.digest('hex')));
});
exports.getHash = getHash;
