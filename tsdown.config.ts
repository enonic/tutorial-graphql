import {transform} from '@swc/core';
import {globSync} from 'glob';
import {defineConfig} from 'tsdown';


const SRC = 'src/main/resources';
const DST = 'build/resources/main';

const logLevel: 'silent' | 'info' = ['QUIET', 'WARN'].includes(process.env.LOG_LEVEL_FROM_GRADLE || '') ? 'silent' : 'info';

// Enonic XP loads each controller/service/task by its resource path, so every
// source file must become its own output file with the directory tree intact.
// Turn a glob into a tsdown `entry` map ({ "relative/name": "src/path/file.ts" }).
function entries(dir: string, exts: string, ignore: string[] = []): Record<string, string> {
  return Object.fromEntries(
    globSync(`${dir}/**/*.${exts}`, {posix: true, ignore})
      .map(file => [file.slice(dir.length + 1).replace(/\.[^.]+$/, ''), file]),
  );
}

const serverEntry = entries(SRC, '{ts,js}', [`${SRC}/**/*.d.ts`, `${SRC}/types/**`]);

// XP runtime libraries are provided by the platform — never bundle them.
const xpExternal = [
  '/lib/graphql',
  '/lib/graphql-connection',
  '/lib/graphql-rx',
  /^\/lib\/xp\//,
];

// Nashorn (XP's server-side JS engine) lacks ES2015 destructuring, but Oxc —
// tsdown's transformer — can't target below es2015. Re-lower the bundled server
// output to es5 with SWC after bundling, so bundled deps are covered too.
const nashornEs5 = {
  name: 'nashorn-es5',
  async renderChunk(code: string) {
    const out = await transform(code, {
      jsc: {
        parser: {syntax: 'ecmascript'},
        target: 'es5',
        loose: true,
        externalHelpers: false,
      },
      isModule: false,
      minify: false,
      sourceMaps: false,
    });
    return {code: out.code, map: null};
  },
};

export default defineConfig([
  {
    entry: serverEntry,
    outDir: DST,
    format: 'cjs' as const,
    target: 'es2015', // Rolldown/oxc floor; nashornEs5 plugin re-lowers to es5 for Nashorn
    platform: 'neutral' as const,
    clean: false, // outDir also holds Gradle-copied resources
    dts: false, // d.ts files are useless at runtime
    minify: false, // minifying server files makes debugging harder
    sourcemap: false,
    logLevel,
    plugins: [nashornEs5],
    tsconfig: `${SRC}/tsconfig.json`,
    inputOptions: {
      external: xpExternal,
      resolve: {
        mainFields: ['module', 'main'],
      },
    },
    outputOptions: {
      chunkFileNames: '_chunks/[name]-[hash].js', // avoid chunk-name collisions
    },
  },
]);
