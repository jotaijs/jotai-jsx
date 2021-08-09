import { useMemo } from './useMemo';

export function useCallback<Fn extends (...args: any[]) => any>(
  fn: Fn,
  deps: unknown[],
) {
  return useMemo(() => fn, deps);
}
