export declare function findNamespace(path: string, namespaces: Record<string, string[]>): string | undefined;
export declare function getParentBranch(branchName: string): string;
export declare const getHash: (path: string) => Promise<string>;
