import * as crypto from 'crypto';
import * as fs from 'fs';
import { execSync } from 'child_process';

export function findNamespace(
  path: string,
  namespaces: Record<string, string[]>
) {
  // console.log('Searching namespace for '+ path);
  return Object.keys(namespaces).find((n) => {
    return namespaces[n][0].includes(path);
  });
}

export function getParentBranch(branchName: string) {
  return (
    execSync(
      'git show-branch -a |  grep \'\\*\' | grep -v "' +
      branchName +
      '" | head -n1 | sed \'s/.*\\[\\(.*\\)\\].*/\\1/\' | sed \'s/[\\^~].*//\'',
      {}
    )
  )
    .toString('utf-8')
    .replace(/\n/g, '');
}

export const getHash = (path: string): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const rs = fs.createReadStream(path);
    rs.on('error', reject);
    rs.on('data', (chunk) => hash.update(chunk));
    rs.on('end', () => resolve(hash.digest('hex')));
  });
