import { atom } from 'jotai';
import { useAtom, useConstant } from '../index';

export function useState<Value>(initialValue: Value) {
  const stateAtom = useConstant(() => atom(initialValue));
  return useAtom(stateAtom);
}
