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
exports.getImports = getImports;
const module_1 = require("module");
const ts = __importStar(require("typescript"));
const tsHost = ts.createCompilerHost({
    allowJs: true,
    noEmit: true,
    isolatedModules: true,
    resolveJsonModule: false,
    moduleResolution: ts.ModuleResolutionKind.Classic, // we don't want node_modules
    incremental: true,
    noLib: true,
    noResolve: true,
}, true);
// testd
function getImports(fileName) {
    const sourceFile = tsHost.getSourceFile(fileName, ts.ScriptTarget.Latest, (msg) => {
        throw new Error(`Failed to parse ${fileName}: ${msg}`);
    });
    if (!sourceFile)
        throw ReferenceError(`Failed to find file ${fileName}`);
    const importing = [];
    delintNode(sourceFile);
    return importing;
    function delintNode(node) {
        if (ts.isImportDeclaration(node)) {
            const moduleName = node.moduleSpecifier.getText().replace(/['"]/g, '');
            if (!moduleName.startsWith('node:') &&
                !module_1.builtinModules.includes(moduleName))
                importing.push(moduleName);
        }
        else
            ts.forEachChild(node, delintNode);
    }
}
