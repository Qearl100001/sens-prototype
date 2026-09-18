import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import {
  cp,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDir, '..');
const exampleRelativePath = path.join('examples', 'feature-selection', 'prototype');
const excludedSegments = new Set(['.git', 'node_modules', 'dist']);
const retainedTemporaryCopy = process.env.KEEP_DELIVERY_TMP === '1';

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

function shouldCopy(source) {
  const relativePath = path.relative(repositoryRoot, source);
  if (!relativePath) return true;
  return !relativePath.split(path.sep).some((segment) => excludedSegments.has(segment));
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(entryPath)));
    } else {
      files.push(entryPath);
    }
  }

  return files;
}

function contentType(filePath) {
  const extension = path.extname(filePath);
  return {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  }[extension] ?? 'application/octet-stream';
}

async function verifyStaticBundle(distDirectory) {
  const server = createServer(async (request, response) => {
    try {
      const requestedPath = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
      const relativePath = requestedPath === '/' ? 'index.html' : requestedPath.replace(/^\/+/, '');
      const resolvedPath = path.resolve(distDirectory, relativePath);

      if (!resolvedPath.startsWith(`${path.resolve(distDirectory)}${path.sep}`)) {
        response.writeHead(403).end('Forbidden');
        return;
      }

      const fileStat = await stat(resolvedPath);
      if (!fileStat.isFile()) throw new Error('Not a file');
      response.writeHead(200, { 'content-type': contentType(resolvedPath) });
      response.end(await readFile(resolvedPath));
    } catch {
      response.writeHead(404).end('Not found');
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Unable to resolve preview port');
    const baseUrl = `http://127.0.0.1:${address.port}/`;
    const indexResponse = await fetch(baseUrl);
    if (!indexResponse.ok) throw new Error(`index.html returned ${indexResponse.status}`);
    const html = await indexResponse.text();
    const assetPaths = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((assetPath) => !assetPath.startsWith('data:'));

    if (assetPaths.length === 0) throw new Error('No built assets were referenced by index.html');

    for (const assetPath of assetPaths) {
      const assetUrl = new URL(assetPath, baseUrl);
      const assetResponse = await fetch(assetUrl);
      if (!assetResponse.ok) {
        throw new Error(`${assetPath} returned ${assetResponse.status}`);
      }
    }

    return { baseUrl, assetCount: assetPaths.length };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function assertNoPersonalPaths(pathsToCheck) {
  const forbiddenFragments = [
    '/Users/',
    'file:///Users/',
    'npm.fe.sensorsdata.cn',
  ];

  for (const targetPath of pathsToCheck) {
    const files = (await stat(targetPath)).isDirectory()
      ? await listFiles(targetPath)
      : [targetPath];

    for (const filePath of files) {
      const content = await readFile(filePath);
      const text = content.toString('utf8');
      const match = forbiddenFragments.find((fragment) => text.includes(fragment));
      if (match) throw new Error(`Personal path ${match} remains in ${filePath}`);
    }
  }
}

const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'sens-prototype-p0-5-'));
const copiedRepository = path.join(temporaryRoot, 'sens-prototype');
const copiedExample = path.join(copiedRepository, exampleRelativePath);

try {
  console.log(`1/5 Copying a clean repository to ${copiedRepository}`);
  await cp(repositoryRoot, copiedRepository, {
    recursive: true,
    filter: shouldCopy,
  });

  console.log('2/5 Installing dependencies from the copied repository');
  await run('npm', ['ci'], copiedExample);

  console.log('3/5 Building the copied feature-selection prototype');
  await run('npm', ['run', 'build'], copiedExample);

  const copiedDist = path.join(copiedExample, 'dist');
  console.log('4/5 Serving and checking generated HTML, JavaScript and CSS');
  const staticResult = await verifyStaticBundle(copiedDist);

  console.log('5/5 Checking the delivery bundle for personal absolute paths');
  await assertNoPersonalPaths([
    copiedDist,
    path.join(copiedRepository, 'examples', 'feature-selection', 'prototype-spec.json'),
    path.join(copiedRepository, 'package-lock.json'),
    path.join(copiedRepository, 'examples', 'component-smoke', 'package-lock.json'),
    path.join(copiedExample, 'package-lock.json'),
  ]);

  console.log(
    JSON.stringify(
      {
        status: 'pass',
        cleanInstall: true,
        build: true,
        staticHttp: staticResult,
        privateReferences: false,
        temporaryCopy: retainedTemporaryCopy ? copiedRepository : 'removed',
      },
      null,
      2,
    ),
  );
} finally {
  if (!retainedTemporaryCopy) await rm(temporaryRoot, { recursive: true, force: true });
}
