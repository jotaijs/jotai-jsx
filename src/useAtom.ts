import {
  createState,
  readAtom,
  writeAtom,
  subscribeAtom,
  flushPending,
} from './vendor/vanilla';
import type { Atom, WritableAtom, SetAtom } from './vendor/atom';

import { renderStack } from './render';

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

  type SetAtomType = (update: Update) => void;
  const setAtom: SetAtomType =
    hookCtx?.atom === atom
      ? (hookCtx?.setAtom as SetAtomType)
      : (update) => {
          if (isWritable(atom)) {
            writeAtom(globalState, atom, update);
          } else {
            throw new Error('not writable atom');
          }
        };

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
            ctx.rerender?.();
          }
        }),
        atom,
        setAtom,
      };
    }
    flushPending(globalState);
  });

  return [value, setAtom];
}
