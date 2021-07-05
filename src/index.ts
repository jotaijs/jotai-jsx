import {
  createState,
  readAtom,
  writeAtom,
  subscribeAtom,
  flushPending,
} from './vendor/vanilla';
import type { Atom, WritableAtom, SetAtom } from './vendor/atom';

export { atom } from './vendor/atom';

const isTextInput = (ele: any) => (
  ele.type === 'input' && (
    !ele.props.type
    || ele.props.type === 'text'
    || ele.props.type === 'textarea'
  )
);

type RenderContext = {
  ele?: any;
  parent?: any;
  node?: any;
  children: Map<unknown, RenderContext>;
  selectionStart?: number; // for text(area) input only
};

const childRenderContext = (ctx: RenderContext, key: unknown) => {
  let childCtx = ctx.children.get(key);
  if (!childCtx) {
    childCtx = { children: new Map() };
    ctx.children.set(key, childCtx);
  }
  return childCtx;
};

const renderStack: (() => void)[] = [];

let inRender = 0;

export function render(
  ele: any,
  parent: any,
  ctx: RenderContext = { children: new Map() },
) {
  ++inRender;
  if (ele === null || ele === undefined) {
    // do nothing
  } else if (ctx.ele === ele && ctx.parent === parent) {
    // TODO test stable element no re-rendering
    // not changed
  } else if (typeof ele === 'string' || typeof ele === 'number') {
    const node = document.createTextNode(String(ele));
    if (ctx.node && ctx.parent === parent) {
      parent.replaceChild(node, ctx.node);
    } else {
      parent.appendChild(node);
    }
    ctx.ele = ele;
    ctx.parent = parent;
    ctx.node = node;
  } else if (Array.isArray(ele)) {
    ele.forEach((item, index) => {
      // TODO test array item key works as expected?
      render(item, parent, childRenderContext(ctx, item?.key ?? index));
    });
    ctx.ele = ele;
    ctx.parent = parent;
  } else if (ele.type === Symbol.for('react.fragment')) {
    render(ele.props.children, parent, childRenderContext(ctx, ele.key));
    ctx.ele = ele;
    ctx.parent = parent;
  } else if (typeof ele.type === 'string') {
    const node = document.createElement(ele.type);
    Object.keys(ele.props).forEach((key) => {
      if (key === 'children') {
        // do nothing
      } else if (key === 'onChange' && isTextInput(ele) && 'value' in ele.props) {
        node.addEventListener('input', (event: any) => {
          if (event.target === ctx.node) {
            ctx.selectionStart = event.target.selectionStart;
            ele.props[key](event);
          }
        });
        node.addEventListener('blur', (event: any) => {
          if (event.target === ctx.node && !inRender) {
            delete ctx.selectionStart;
          }
        });
      } else if (key.startsWith('on')) {
        node.addEventListener(key.slice(2).toLowerCase(), (event: any) => {
          if (event.target === ctx.node) {
            ele.props[key](event);
          }
        });
      } else {
        // TODO handle other special props (defaultValue)
        node.setAttribute(key, ele.props[key]);
      }
    });
    if (ctx.node && ctx.parent === parent) {
      parent.replaceChild(node, ctx.node);
    } else {
      parent.appendChild(node);
    }
    if (typeof ctx.selectionStart === 'number' && isTextInput(ele)) {
      node.focus();
      node.setSelectionRange(ctx.selectionStart, ctx.selectionStart);
    }
    render(ele.props.children, node, childRenderContext(ctx, ele.key));
    ctx.ele = ele;
    ctx.parent = parent;
    ctx.node = node;
  } else if (typeof ele.type === 'function') {
    let wip = false; // NOTE is this good? (why we need this?)
    const rerender = () => {
      if (wip) {
        return;
      }
      wip = true;
      renderStack.unshift(rerender);
      render(ele.type(ele.props), parent, childRenderContext(ctx, ele.key));
      renderStack.shift();
      wip = false;
    };
    rerender();
    ctx.ele = ele;
    ctx.parent = parent;
  } else {
    // console.log('unhandled ele', ele);
    throw new Error(`unhandled ele: ${typeof ele} ${ele?.type}`);
  }
  --inRender;
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
