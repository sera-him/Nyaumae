import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

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
      return nextResolve(`${target}.ts`, context);
    }
  },
});
