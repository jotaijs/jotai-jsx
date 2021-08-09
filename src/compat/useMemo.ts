import { useConstant } from '../index';

const areEqualDeps = (a: unknown[], b: unknown[]): boolean => {
  if (a.length !== b.length) {
    throw new Error('deps length changed');
  }
  return a.every((x, i) => x === b[i]);
};

export function useMemo<Value>(fn: () => Value, deps: unknown[]) {
  const ref = useConstant(() => ({} as { value?: Value; deps?: unknown[] }));
  if (!ref.deps || !areEqualDeps(deps, ref.deps)) {
    ref.value = fn();
    ref.deps = deps;
  }
  return ref.value as Value;
}
