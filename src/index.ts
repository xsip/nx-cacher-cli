// import * as simpleGit from 'simple-git';
import fs from 'fs';

import * as glob from 'glob';
import { AppsAndLibs, CustomCache, ShouldRunForCommit } from './types';
import { findNamespace, getHash } from './utils';
import { getImports } from './helper';

/*const git = simpleGit.gitP('./', {
    // binary: 'C:\\cmder\\vendor\\git-for-windows\\bin\\git.exe',
});*/

async function createCacheFromCurrentBranchForCi() {
    const cacheData: CustomCache = {data: {}};
    const paths = JSON.parse(fs.readFileSync('./tsconfig.base.json', 'utf8'))
      .compilerOptions.paths;
    // const _currentBranch = (await git.branch()).current;
    // const currentCommit = await git.revparse('HEAD', []);
    const currentIdentifier: string = 'current' // `${_currentBranch}-${currentCommit}`;

    cacheData.data[currentIdentifier] = [] as AppsAndLibs[];

    const currentPackageJson = JSON.parse(
      fs.readFileSync('./package.json', 'utf8')
    );
    const newDeps = {
        ...currentPackageJson.dependencies,
        ...currentPackageJson.devDependencies,
    };

    // console.log(`[NAME] => OLD | NEW`);
    const updatedDeps: Record<string, string> = {};
    // console.log(newDeps)
    for (const dep of Object.keys(newDeps)) {
        updatedDeps[dep] = newDeps[dep];
    }
    // console.log(updatedDeps);
    // console.log(packageJsonFiles);
    const appsAndLibs: AppsAndLibs[] = [
        ...glob.sync('./apps/**/project.json'),
        ...glob.sync('./ci/**/project.json'),
        ...glob.sync('./libs/**/project.json'),
    ].map((path) => {
        const projectJson: any = JSON.parse(fs.readFileSync(path, 'utf-8'));
        const fsPath = path.replace(/\\/g, '/').replace('/project.json', '');
        return {
            name: projectJson.name,
            path: fsPath,
            namespace: findNamespace(fsPath, paths) ?? findNamespace(projectJson.sourceRoot, paths) ?? '',
        };
    });
    const namespaces = appsAndLibs.map(al => al.namespace).filter(e => e);

    // console.log(updatedDeps);
    // return;
    for (const change in appsAndLibs) {
        const hashes: Record<string, string> = {};
        const filesInProject = glob.sync(`${appsAndLibs[change].path}/src/**/*.ts`);
        let importList: string[] = [];
        for (const file of filesInProject) {
            if (file.includes('.spec.ts')) continue;
            const currentLibImports = getImports(file);
            importList = [...currentLibImports];
            const usedNameSpaces = importList.filter(e => {
                return namespaces.find(ns => ns === e);
            });
            appsAndLibs[change].dependsOnLib = [...(appsAndLibs[change].dependsOnLib ?? []), ...usedNameSpaces].filter((e, i, a) => a.indexOf(e) == i);

            hashes[file] = await getHash(file);

            // @ts-ignore
            if (hashes[file] !== cacheData.data[currentIdentifier][file]) {
                // @ts-ignore
                cacheData.data[currentIdentifier][file] = hashes[file];
            }

            for (const updateDep of Object.keys(updatedDeps)) {
                if (currentLibImports.includes(updateDep)) {
                    appsAndLibs[change].usesUpdatedPackages = [
                        ...(appsAndLibs[change].usesUpdatedPackages ?? []),
                        {[updateDep]: updatedDeps[updateDep]},
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
}

async function compareCacheForCi(
  oldCache: Record<string, AppsAndLibs[]>[]
) {
    const currentCommit = 'current'; // `${(await git.branch()).current}-${await git.revparse('HEAD', [])}`;
    // const _currentCommit = await git.revparse('HEAD', []);
    // const _currentBranch = (await git.branch()).current;
    /*const _previousCommit = await git.revparse('HEAD~1', []);
    const previousCommit = `${_currentBranch}-${
      _previousCommit
    }`;*/
    // wdqw
    const currentBranch = 'current';// `${_currentBranch}-${_currentCommit}`;

    const shouldRun: ShouldRunForCommit = {};

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
    const newCache: AppsAndLibs[] = (await createCacheFromCurrentBranchForCi()).data[currentBranch];
    for (const entry in newCache) {
        for (const file of Object.keys(newCache[entry].hashes ?? {})) {
            if (
              !shouldRun[currentCommit].shouldRunBecauseOfDependencies.find((e) =>
                e.name.includes(newCache[entry].name)
              ) &&
              newCache[entry].usesUpdatedPackages?.length
            ) {
                for (const updatedDep of Object.keys(
                  newCache[entry].usesUpdatedPackages
                )) {

                    const key = Object.keys(
                      // @ts-ignore
                      newCache[entry].usesUpdatedPackages[updatedDep]
                    )[0];
                    if (
                      // @ts-ignore
                      newCache[entry].usesUpdatedPackages[updatedDep][key] !==
                      // @ts-ignore
                      oldCache?.[entry]?.usesUpdatedPackages?.[updatedDep]?.[key]
                    ) {
                        shouldRun[currentCommit].shouldRunBecauseOfDependencies.push({
                            name: newCache[entry].name,
                            dependencies: {
                                new: newCache[entry].usesUpdatedPackages,
                                old: oldCache?.[entry]?.usesUpdatedPackages as unknown as  Record<string, string>[],
                            },
                        });
                        break;
                    }
                }
            }
            if (
              // @ts-ignore
              newCache?.[entry]?.hashes?.[file] !== oldCache?.[entry]?.hashes?.[file]
            ) {
                if (
                  !shouldRun[currentCommit].shouldRunBecauseOfFsChanges.includes(
                    newCache[entry].name
                  )
                )
                    shouldRun[currentCommit].shouldRunBecauseOfFsChanges.push(
                      newCache[entry].name
                    );

                if (
                  newCache[entry].namespace &&
                  !shouldRun[currentCommit].shouldRunNameSpaces.includes(
                    newCache[entry].namespace
                  )
                )
                    shouldRun[currentCommit].shouldRunNameSpaces.push(
                      newCache[entry].namespace
                    );
            } else {
            }
        }
    }
    shouldRun[currentCommit].shouldRunBecauseOfInternalDependencies = [];

    for (const fsEntry of [
        ...shouldRun[currentCommit].shouldRunBecauseOfFsChanges,
    ]) {
        for (const entry of newCache) {
            if (entry?.dependsOnLib?.map(e => newCache.find(e2 => e2.namespace === e)?.name).includes(fsEntry as string)) {
                shouldRun[currentCommit].shouldRunBecauseOfInternalDependencies = [
                    ...(shouldRun[currentCommit].shouldRunBecauseOfInternalDependencies ?? []),
                    entry.name
                ].filter((e, i, a) => a.indexOf(e) === i);
            }
        }
    }

    for (const fsEntry of [
        ...shouldRun[currentCommit].shouldRunBecauseOfDependencies
        ,
    ]) {
        for (const entry of newCache) {
            if (entry?.dependsOnLib?.map(e => newCache.find(e2 => e2.namespace === e)?.name).includes(fsEntry.name)) {
                shouldRun[currentCommit].shouldRunBecauseOfInternalDependencies = [
                    ...(shouldRun[currentCommit].shouldRunBecauseOfInternalDependencies ?? []),
                    entry.name
                ].filter((e, i, a) => a.indexOf(e) === i);
            }
        }
    }
    return shouldRun[currentCommit];
}

if (process.argv?.[2] !== 'output') {

    const oldCache: Record<string, AppsAndLibs[]>[] = JSON.parse(fs.readFileSync(process.argv?.[3], 'utf-8'));
    (async () => {
        // const cache = JSON.parse(fs.readFileSync('./cacher/cache-current.json', 'utf8'));
        const currentCache = await compareCacheForCi(oldCache);
        const shouldRun: string[] = [
            ...currentCache.shouldRunBecauseOfDependencies.map(r => r.name),
            ...currentCache.shouldRunBecauseOfFsChanges,
            ...(currentCache.shouldRunBecauseOfInternalDependencies ?? [])
        ].filter((e, i, a) => a.indexOf(e) === i);
        if (shouldRun?.length)
            console.log(shouldRun.join(' ')); // \`npx nx run-many -t build -p ${shouldRun.join(' ')} --parallel=5
        else
            console.log(''); // npm run no-pipeline-needed
    })();
} else {
    // testwdwwdwadq

    (async () => {
        const cacheData = await createCacheFromCurrentBranchForCi();
        const firstKey = Object.keys(cacheData.data)[0];
        fs.writeFileSync(process.argv?.[3],JSON.stringify(cacheData.data[firstKey]), 'utf-8');
    })();
}
