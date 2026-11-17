import { registerHooks } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const SRC_ROOT = path.resolve(process.cwd(), 'src');

registerHooks({
  resolve(specifier, context, nextResolve) {
    let target = specifier;
    let useSuffix = false;
    if (specifier.startsWith('@/')) {
      target = pathToFileURL(path.join(SRC_ROOT, specifier.slice(2))).href;
      useSuffix = true;
    } else if (specifier.startsWith('.')) {
      useSuffix = true;
    }
    if (!useSuffix) {
      return nextResolve(specifier, context);
    }
    try {
      return nextResolve(target, context);
    } catch {
      for (const suffix of ['.ts', '.tsx']) {
        try {
          return nextResolve(`${target}${suffix}`, context);
        } catch {
          // Try the next TypeScript source suffix.
        }
      }
      return nextResolve(target, context);
    }
  },
  load(url, context, nextLoad) {
    if (!url.endsWith('.tsx')) return nextLoad(url, context);
    const source = readFileSync(fileURLToPath(url), 'utf-8');
    const output = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.ReactJSX,
      },
    });
    return { format: 'module', source: output.outputText, shortCircuit: true };
  },
});
