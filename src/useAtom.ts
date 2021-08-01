import type { Atom, WritableAtom } from 'jotai';
import {
  createState,
  readAtom,
  writeAtom,
  subscribeAtom,
  flushPending,
} from './vendor/vanilla';

import { renderStack } from './render';

export type SetAtom<Update> = undefined extends Update
  ? (update?: Update) => void
  : (update: Update) => void;

// TODO context
const globalState = createState();

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
  const atomState = readAtom(globalState, atom);
  // TODO error, promise
  const value = atomState.v;

  const ctx = renderStack[0];
  const { hookIndex } = ctx;
  const hookCtx: typeof renderStack[number]['hooks'][number] | undefined =
    ctx.hooks[hookIndex];

  let setAtom = (update?: Update) => {
    if (isWritable(atom)) {
      writeAtom(globalState, atom, update as Update);
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
        cleanup: subscribeAtom(globalState, atom, () => {
          const nextAtomState = readAtom(globalState, atom);
          // TODO error, promise
          if (!Object.is(nextAtomState.v, prevValue)) {
            prevValue = nextAtomState.v;
            ctx.rerender?.(true);
          }
        }),
        atom,
        setAtom: setAtom as SetAtom<unknown>,
      };
    }
    flushPending(globalState);
  });

  return [value, setAtom];
}
