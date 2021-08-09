import { useConstant } from '../index';

export function useRef<Value>(initialValue?: Value) {
  return useConstant(() => ({ current: initialValue }));
}
