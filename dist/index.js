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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
// import * as simpleGit from 'simple-git';
const fs_1 = __importDefault(require("fs"));
const glob = __importStar(require("glob"));
const utils_1 = require("./utils");
const helper_1 = require("./helper");
/*const git = simpleGit.gitP('./', {
    // binary: 'C:\\cmder\\vendor\\git-for-windows\\bin\\git.exe',
});*/
function createCacheFromCurrentBranchForCi() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const cacheData = { data: {} };
        const paths = JSON.parse(fs_1.default.readFileSync('./tsconfig.base.json', 'utf8'))
            .compilerOptions.paths;
        // const _currentBranch = (await git.branch()).current;
        // const currentCommit = await git.revparse('HEAD', []);
        const currentIdentifier = 'current'; // `${_currentBranch}-${currentCommit}`;
        cacheData.data[currentIdentifier] = [];
        const currentPackageJson = JSON.parse(fs_1.default.readFileSync('./package.json', 'utf8'));
        const newDeps = Object.assign(Object.assign({}, currentPackageJson.dependencies), currentPackageJson.devDependencies);
        // console.log(`[NAME] => OLD | NEW`);
        const updatedDeps = {};
        // console.log(newDeps)
        for (const dep of Object.keys(newDeps)) {
            updatedDeps[dep] = newDeps[dep];
        }
        // console.log(updatedDeps);
        // console.log(packageJsonFiles);
        const appsAndLibs = [
            ...glob.sync('./apps/**/project.json'),
            ...glob.sync('./ci/**/project.json'),
            ...glob.sync('./libs/**/project.json'),
        ].map((path) => {
            var _a, _b;
            const projectJson = JSON.parse(fs_1.default.readFileSync(path, 'utf-8'));
            const fsPath = path.replace(/\\/g, '/').replace('/project.json', '');
            return {
                name: projectJson.name,
                path: fsPath,
                namespace: (_b = (_a = (0, utils_1.findNamespace)(fsPath, paths)) !== null && _a !== void 0 ? _a : (0, utils_1.findNamespace)(projectJson.sourceRoot, paths)) !== null && _b !== void 0 ? _b : '',
            };
        });
        const namespaces = appsAndLibs.map(al => al.namespace).filter(e => e);
        // console.log(updatedDeps);
        // return;
        for (const change in appsAndLibs) {
            const hashes = {};
            const filesInProject = glob.sync(`${appsAndLibs[change].path}/src/**/*.ts`);
            let importList = [];
            for (const file of filesInProject) {
                if (file.includes('.spec.ts'))
                    continue;
                const currentLibImports = (0, helper_1.getImports)(file);
                importList = [...currentLibImports];
                const usedNameSpaces = importList.filter(e => {
                    return namespaces.find(ns => ns === e);
                });
                appsAndLibs[change].dependsOnLib = [...((_a = appsAndLibs[change].dependsOnLib) !== null && _a !== void 0 ? _a : []), ...usedNameSpaces].filter((e, i, a) => a.indexOf(e) == i);
                hashes[file] = yield (0, utils_1.getHash)(file);
                // @ts-ignore
                if (hashes[file] !== cacheData.data[currentIdentifier][file]) {
                    // @ts-ignore
                    cacheData.data[currentIdentifier][file] = hashes[file];
                }
                for (const updateDep of Object.keys(updatedDeps)) {
                    if (currentLibImports.includes(updateDep)) {
                        appsAndLibs[change].usesUpdatedPackages = [
                            ...((_b = appsAndLibs[change].usesUpdatedPackages) !== null && _b !== void 0 ? _b : []),
                            { [updateDep]: updatedDeps[updateDep] },
                        ];
                        break;
                    }
                }
            }
            importList = importList.filter((e, i, a) => a.indexOf(e) === i);
            appsAndLibs[change].hashes = hashes;
            appsAndLibs[change].importedPackages = importList;
        }
        cacheData.data[currentIdentifier] = appsAndLibs;
        // fs.writeFileSync('./cacher/cache-test.json', JSON.stringify(cacheData, null, 2), 'utf-8');
        // fs.writeFileSync('./cacher/should-run.json', JSON.stringify(shouldRun, null, 2), 'utf-8');
        // console.log(changes)
        return cacheData;
    });
}
function compareCacheForCi(oldCache) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        const currentCommit = 'current'; // `${(await git.branch()).current}-${await git.revparse('HEAD', [])}`;
        // const _currentCommit = await git.revparse('HEAD', []);
        // const _currentBranch = (await git.branch()).current;
        /*const _previousCommit = await git.revparse('HEAD~1', []);
        const previousCommit = `${_currentBranch}-${
          _previousCommit
        }`;*/
        // wdqw
        const currentBranch = 'current'; // `${_currentBranch}-${_currentCommit}`;
        const shouldRun = {};
        if (!shouldRun[currentCommit]) {
            shouldRun[currentCommit] = {
                shouldRunNameSpaces: [],
                shouldRunBecauseOfFsChanges: [],
                // previousCommitHash: previousCommit,
                // currentCommitHash: currentCommit,
                updatedDependencies: {},
                shouldRunBecauseOfDependencies: [],
            };
        }
        shouldRun[currentCommit].shouldRunNameSpaces = [];
        shouldRun[currentCommit].shouldRunBecauseOfFsChanges = [];
        shouldRun[currentCommit].shouldRunBecauseOfDependencies = [];
        const newCache = (yield createCacheFromCurrentBranchForCi()).data[currentBranch];
        for (const entry in newCache) {
            for (const file of Object.keys((_a = newCache[entry].hashes) !== null && _a !== void 0 ? _a : {})) {
                if (!shouldRun[currentCommit].shouldRunBecauseOfDependencies.find((e) => e.name.includes(newCache[entry].name)) &&
                    ((_b = newCache[entry].usesUpdatedPackages) === null || _b === void 0 ? void 0 : _b.length)) {
                    for (const updatedDep of Object.keys(newCache[entry].usesUpdatedPackages)) {
                        const key = Object.keys(
                        // @ts-ignore
                        newCache[entry].usesUpdatedPackages[updatedDep])[0];
                        if (
                        // @ts-ignore
                        newCache[entry].usesUpdatedPackages[updatedDep][key] !==
                            (
                            // @ts-ignore
                            (_e = (_d = (_c = oldCache === null || oldCache === void 0 ? void 0 : oldCache[entry]) === null || _c === void 0 ? void 0 : _c.usesUpdatedPackages) === null || _d === void 0 ? void 0 : _d[updatedDep]) === null || _e === void 0 ? void 0 : _e[key])) {
                            shouldRun[currentCommit].shouldRunBecauseOfDependencies.push({
                                name: newCache[entry].name,
                                dependencies: {
                                    new: newCache[entry].usesUpdatedPackages,
                                    old: (_f = oldCache === null || oldCache === void 0 ? void 0 : oldCache[entry]) === null || _f === void 0 ? void 0 : _f.usesUpdatedPackages,
                                },
                            });
                            break;
                        }
                    }
                }
                if (
                // @ts-ignore
                ((_h = (_g = newCache === null || newCache === void 0 ? void 0 : newCache[entry]) === null || _g === void 0 ? void 0 : _g.hashes) === null || _h === void 0 ? void 0 : _h[file]) !== ((_k = (_j = oldCache === null || oldCache === void 0 ? void 0 : oldCache[entry]) === null || _j === void 0 ? void 0 : _j.hashes) === null || _k === void 0 ? void 0 : _k[file])) {
                    if (!shouldRun[currentCommit].shouldRunBecauseOfFsChanges.includes(newCache[entry].name))
                        shouldRun[currentCommit].shouldRunBecauseOfFsChanges.push(newCache[entry].name);
                    if (newCache[entry].namespace &&
                        !shouldRun[currentCommit].shouldRunNameSpaces.includes(newCache[entry].namespace))
                        shouldRun[currentCommit].shouldRunNameSpaces.push(newCache[entry].namespace);
                }
                else {
                }
            }
        }
        shouldRun[currentCommit].shouldRunBecauseOfInternalDependencies = [];
        for (const fsEntry of [
            ...shouldRun[currentCommit].shouldRunBecauseOfFsChanges,
        ]) {
            for (const entry of newCache) {
                if ((_l = entry === null || entry === void 0 ? void 0 : entry.dependsOnLib) === null || _l === void 0 ? void 0 : _l.map(e => { var _a; return (_a = newCache.find(e2 => e2.namespace === e)) === null || _a === void 0 ? void 0 : _a.name; }).includes(fsEntry)) {
                    shouldRun[currentCommit].shouldRunBecauseOfInternalDependencies = [
                        ...((_m = shouldRun[currentCommit].shouldRunBecauseOfInternalDependencies) !== null && _m !== void 0 ? _m : []),
                        entry.name
                    ].filter((e, i, a) => a.indexOf(e) === i);
                }
            }
        }
        for (const fsEntry of [
            ...shouldRun[currentCommit].shouldRunBecauseOfDependencies,
        ]) {
            for (const entry of newCache) {
                if ((_o = entry === null || entry === void 0 ? void 0 : entry.dependsOnLib) === null || _o === void 0 ? void 0 : _o.map(e => { var _a; return (_a = newCache.find(e2 => e2.namespace === e)) === null || _a === void 0 ? void 0 : _a.name; }).includes(fsEntry.name)) {
                    shouldRun[currentCommit].shouldRunBecauseOfInternalDependencies = [
                        ...((_p = shouldRun[currentCommit].shouldRunBecauseOfInternalDependencies) !== null && _p !== void 0 ? _p : []),
                        entry.name
                    ].filter((e, i, a) => a.indexOf(e) === i);
                }
            }
        }
        return shouldRun[currentCommit];
    });
}
if (((_a = process.argv) === null || _a === void 0 ? void 0 : _a[2]) !== 'output') {
    const oldCache = JSON.parse(fs_1.default.readFileSync((_b = process.argv) === null || _b === void 0 ? void 0 : _b[3], 'utf-8'));
    (() => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        // const cache = JSON.parse(fs.readFileSync('./cacher/cache-current.json', 'utf8'));
        const currentCache = yield compareCacheForCi(oldCache);
        const shouldRun = [
            ...currentCache.shouldRunBecauseOfDependencies.map(r => r.name),
            ...currentCache.shouldRunBecauseOfFsChanges,
            ...((_a = currentCache.shouldRunBecauseOfInternalDependencies) !== null && _a !== void 0 ? _a : [])
        ].filter((e, i, a) => a.indexOf(e) === i);
        if (shouldRun === null || shouldRun === void 0 ? void 0 : shouldRun.length)
            console.log(shouldRun.join(' ')); // \`npx nx run-many -t build -p ${shouldRun.join(' ')} --parallel=5
        else
            console.log(''); // npm run no-pipeline-needed
    }))();
}
else {
    // testwdwwdwadq
    (() => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const cacheData = yield createCacheFromCurrentBranchForCi();
        const firstKey = Object.keys(cacheData.data)[0];
        fs_1.default.writeFileSync((_a = process.argv) === null || _a === void 0 ? void 0 : _a[3], JSON.stringify(cacheData.data[firstKey]), 'utf-8');
    }))();
}
