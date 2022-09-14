import type { Atom, WritableAtom } from 'jotai';
import {
  createStore,
  READ_ATOM,
  WRITE_ATOM,
  COMMIT_ATOM,
  SUBSCRIBE_ATOM,
} from './vendor/store';

import { renderStack } from './render';

export type SetAtom<Update> = undefined extends Update
  ? (update?: Update) => void
  : (update: Update) => void;

// TODO context
const globalStore = createStore();

const isWritable = <Value, Update>(
  atom: Atom<Value> | WritableAtom<Value, Update>,
): atom is WritableAtom<Value, Update> =>
  !!(atom as WritableAtom<Value, Update>).write;

export function useAtom<Value, Update>(
  atom: WritableAtom<Value | Promise<Value>, Update>,
): [Value, SetAtom<Update>];

export function useAtom<Value, Update>(
  atom: WritableAtom<Promise<Value>, Update>,
): [Value, SetAtom<Update>];

export function useAtom<Value, Update>(
  atom: WritableAtom<Value, Update>,
): [Value, SetAtom<Update>];

export function useAtom<Value>(
  atom: Atom<Value | Promise<Value>>,
): [Value, never];

export function useAtom<Value>(atom: Atom<Promise<Value>>): [Value, never];

export function useAtom<Value>(atom: Atom<Value>): [Value, never];

export function useAtom<Value, Update>(
  atom: Atom<Value> | WritableAtom<Value, Update>,
) {
  const atomState = globalStore[READ_ATOM](atom);
  if (!('v' in atomState)) {
    throw new Error('TODO handle error and promise');
  }
  const value = atomState.v;

  const ctx = renderStack[0] as typeof renderStack[number];
  const { hookIndex } = ctx;
  const hookCtx: typeof renderStack[number]['hooks'][number] | undefined =
    ctx.hooks[hookIndex];
  ++ctx.hookIndex;

  let setAtom = (update?: Update) => {
    if (isWritable(atom)) {
      globalStore[WRITE_ATOM](atom, update as Update);
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
        cleanup: globalStore[SUBSCRIBE_ATOM](atom, () => {
          const nextAtomState = globalStore[READ_ATOM](atom);
          if (!('v' in nextAtomState)) {
            throw new Error('TODO handle error and promise');
          }
          if (!Object.is(nextAtomState.v, prevValue)) {
            prevValue = nextAtomState.v;
            ctx.rerender?.(true);
          }
        }),
        atom,
        setAtom: setAtom as SetAtom<unknown>,
      };
    }
    globalStore[COMMIT_ATOM](atom);
  });

  return [value, setAtom];
}
