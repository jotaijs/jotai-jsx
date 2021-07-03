import {
  createState,
  readAtom,
  writeAtom,
  subscribeAtom,
  flushPending,
} from './vendor/vanilla';
import type { Atom, WritableAtom, SetAtom } from './vendor/atom';

export { atom } from './vendor/atom';

const renderStack: (() => void)[] = [];

// FIXME bail out if ele isn't changed
export function render(ele: any, parent: any, reference: any = null) {
  let node: any;
  if (ele === null || ele === undefined) {
    // do nothing
    node = null;
  } else if (typeof ele === 'string') {
    node = document.createTextNode(ele);
    parent.insertBefore(node, reference);
  } else if (typeof ele === 'number') {
    node = document.createTextNode(String(ele));
    parent.insertBefore(node, reference);
  } else if (Array.isArray(ele)) {
    node = ele.map((item) => render(item, parent));
  } else if (ele.type === Symbol.for('react.fragment')) {
    node = render(ele.props.children, parent);
  } else if (typeof ele.type === 'string') {
    node = document.createElement(ele.type);
    Object.keys(ele.props).forEach((key) => {
      if (key === 'children') {
        // do nothing
      } else if (key.startsWith('on')) {
        // FIXME removeEventListener
        // TODO onChange is not onchange
        node.addEventListener(key.slice(2).toLowerCase(), ele.props[key]);
      } else {
        // TODO handle other special props
        node.setAttribute(key, ele.props[key]);
      }
    });
    parent.insertBefore(node, reference);
    render(ele.props.children, node);
  } else if (typeof ele.type === 'function') {
    let prevNode: any;
    let wip = false; // NOTE is this good?
    const rerender = () => {
      if (wip) {
        return;
      }
      wip = true;
      renderStack.unshift(rerender);
      if (Array.isArray(prevNode)) {
        prevNode.forEach((item) => {
          item.remove();
        });
      } else if (prevNode) {
        prevNode.remove();
      }
      // FIXME preserve order with `reference`
      prevNode = render(ele.type(ele.props), parent);
      renderStack.shift();
      wip = false;
    };
    rerender();
    return prevNode;
  } else {
    // console.log('unhandled ele', ele);
    throw new Error(`unhandled ele: ${typeof ele} ${ele?.type}`);
  }
  return node;
}

// TODO context
const globalState = createState();

const isWritable = <Value, Update>(
  atom: Atom<Value> | WritableAtom<Value, Update>,
): atom is WritableAtom<Value, Update> => (
    !!(atom as WritableAtom<Value, Update>).write
  );

export function useAtom<Value, Update>(
  atom: WritableAtom<Value | Promise<Value>, Update>
): [Value, SetAtom<Update>]

export function useAtom<Value, Update>(
  atom: WritableAtom<Promise<Value>, Update>
): [Value, SetAtom<Update>]

export function useAtom<Value, Update>(
  atom: WritableAtom<Value, Update>
): [Value, SetAtom<Update>]

export function useAtom<Value>(
  atom: Atom<Value | Promise<Value>>
): [Value, never]

export function useAtom<Value>(atom: Atom<Promise<Value>>): [Value, never]

export function useAtom<Value>(atom: Atom<Value>): [Value, never]

export function useAtom<Value, Update>(
  atom: Atom<Value> | WritableAtom<Value, Update>,
) {
  const atomState = readAtom(globalState, atom);
  // TODO error, promise
  const value = atomState.v;

  const rerender = renderStack[0];
  // FIXME unsubscribe
  // FIXME bail out with same value
  subscribeAtom(globalState, atom, rerender);

  // NOTE is this good?
  Promise.resolve().then(() => {
    flushPending(globalState);
  });

  const setAtom = (update: Update) => {
    if (isWritable(atom)) {
      writeAtom(globalState, atom, update);
    } else {
      throw new Error('not writable atom');
    }
  };

  return [value, setAtom];
}
