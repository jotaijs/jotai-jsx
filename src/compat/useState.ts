import { atom } from 'jotai';
import { useAtom, useConstant } from '../index';

export function useState<Value>(initialValue: Value | (() => Value)) {
  const stateAtom = useConstant(() =>
    atom(
      typeof initialValue === 'function'
        ? (initialValue as () => Value)()
        : initialValue,
    ),
  );
  return useAtom(stateAtom);
}
