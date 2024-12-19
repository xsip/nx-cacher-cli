import {builtinModules} from 'module';

import *as  ts from 'typescript';

const tsHost = ts.createCompilerHost(
  {
    allowJs: true,
    noEmit: true,
    isolatedModules: true,
    resolveJsonModule: false,
    moduleResolution: ts.ModuleResolutionKind.Classic, // we don't want node_modules
    incremental: true,
    noLib: true,
    noResolve: true,
  },
  true
);
// testd
export function getImports(fileName: string): readonly string[] {
  const sourceFile = tsHost.getSourceFile(
    fileName,
    ts.ScriptTarget.Latest,
    (msg) => {
      throw new Error(`Failed to parse ${fileName}: ${msg}`);
    }
  );
  if (!sourceFile) throw ReferenceError(`Failed to find file ${fileName}`);
  const importing: string[] = [];
  delintNode(sourceFile);

  return importing;

  function delintNode(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const moduleName = node.moduleSpecifier.getText().replace(/['"]/g, '');
      if (
        !moduleName.startsWith('node:') &&
        !builtinModules.includes(moduleName)
      )
        importing.push(moduleName);
    } else ts.forEachChild(node, delintNode);
  }
}
