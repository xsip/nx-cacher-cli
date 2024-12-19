export type AppsAndLibs = {
    name: string;
    path: string;
    namespace: string;
    importedPackages?: string[];
    hashes?: Record<string, string>;
    usesUpdatedPackages?: Record<string, string>[];
    dependsOnLib?: string[];
};
export type ShouldRunForCommit = Record<string, {
    shouldRunBecauseOfFsChanges: string[];
    shouldRunNameSpaces: string[];
    updatedDependencies: Record<string, string>;
    shouldRunBecauseOfInternalDependencies?: string[];
    shouldRunBecauseOfDependencies: {
        name: string;
        dependencies: {
            old: Record<string, string>[];
            new: Record<string, string>[];
        };
    }[];
}>;
export type CacheData = Record<string, AppsAndLibs[]>;
export type CustomCache = {
    data: Record<string, AppsAndLibs[]>;
};
