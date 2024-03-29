import { atom } from 'jotai/vanilla';
import type { PrimitiveAtom } from 'jotai/vanilla';
import { useAtom, useConstant } from '../index';

const areEqualDeps = (a: unknown[], b: unknown[]): boolean => {
  if (a.length !== b.length) {
    throw new Error('deps length changed');
  }
  return a.every((x, i) => x === b[i]);
};

export function useEffect(fn: () => (() => void) | void, deps?: unknown[]) {
  const ref = useConstant(
    () =>
      ({} as {
        effectAtom?: PrimitiveAtom<null>;
        deps?: unknown[] | undefined;
      }),
  );
  if (!deps || !ref.deps || !areEqualDeps(deps, ref.deps)) {
    delete ref.effectAtom;
    ref.deps = deps;
  }
  if (!ref.effectAtom) {
    ref.effectAtom = atom(null);
    ref.effectAtom.onMount = fn;
  }
  useAtom(ref.effectAtom as PrimitiveAtom<null>);
}
