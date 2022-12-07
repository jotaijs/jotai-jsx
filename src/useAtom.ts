import { createStore } from 'jotai/vanilla';
import type { Atom, WritableAtom } from 'jotai/vanilla';

import { renderStack } from './render';

export type SetAtom<Args extends unknown[], Result> = (...args: Args) => Result;

// TODO context
const globalStore = createStore();

const isWritable = <Value, Args extends unknown[], Result>(
  atom: Atom<Value> | WritableAtom<Value, Args, Result>,
): atom is WritableAtom<Value, Args, Result> =>
  !!(atom as WritableAtom<Value, Args, Result>).write;

export function useAtom<Value, Args extends unknown[], Result>(
  atom: WritableAtom<Value, Args, Result>,
): [Value, SetAtom<Args, Result>];

export function useAtom<Value>(
  atom: Atom<Value | Promise<Value>>,
): [Value, never];

export function useAtom<Value>(atom: Atom<Promise<Value>>): [Value, never];

export function useAtom<Value>(atom: Atom<Value>): [Value, never];

export function useAtom<Value, Args extends unknown[], Result>(
  atom: Atom<Value> | WritableAtom<Value, Args, Result>,
) {
  const value = globalStore.get(atom);

  const ctx = renderStack[0] as typeof renderStack[number];
  const { hookIndex } = ctx;
  const hookCtx: typeof renderStack[number]['hooks'][number] | undefined =
    ctx.hooks[hookIndex];
  ++ctx.hookIndex;

  let setAtom = (...args: Args) => {
    if (isWritable(atom)) {
      globalStore.set(atom, ...args);
    } else {
      throw new Error('not writable atom');
    }
  };

  if (hookCtx) {
    if (!hookCtx.setAtom) {
      throw new Error('hook order changed');
    }
    if (hookCtx.atom === atom) {
      setAtom = hookCtx.setAtom;
    }
  }

  // NOTE is promise microtask good?
  Promise.resolve().then(() => {
    if (!hookCtx || hookCtx.atom !== atom) {
      hookCtx?.cleanup?.();
      let prevValue = value;
      ctx.hooks[hookIndex] = {
        cleanup: globalStore.sub(atom, () => {
          const nextValue = globalStore.get(atom);
          if (!Object.is(nextValue, prevValue)) {
            prevValue = nextValue;
            ctx.rerender?.(true);
          }
        }),
        atom,
        setAtom: setAtom as SetAtom<unknown[], unknown>,
      };
    }
  });

  return [value, setAtom];
}
