import {
  createState,
  readAtom,
  writeAtom,
  subscribeAtom,
  flushPending,
} from './vendor/vanilla';
import type { Atom, WritableAtom, SetAtom } from './vendor/atom';

export { atom } from './vendor/atom';

const isTextInput = (ele: any) =>
  ele.type === 'input' &&
  (!ele.props.type ||
    ele.props.type === 'text' ||
    ele.props.type === 'textarea');

type HookContext = {
  cleanup?: () => void;
  atom?: Atom<any>;
  setAtom?: SetAtom<any>;
};

type RenderContext = {
  ele?: any;
  parent?: any;
  node?: any;
  children: Map<unknown, RenderContext>;
  rerender?: () => void;
  selectionStart?: number; // for text(area) input only
  hooks: HookContext[];
  hookIndex: number;
};

const createRenderContext = () => {
  const ctx: RenderContext = {
    children: new Map(),
    hooks: [],
    hookIndex: 0,
  };
  return ctx;
};

const childRenderContext = (ctx: RenderContext, key: unknown) => {
  let childCtx = ctx.children.get(key);
  if (!childCtx) {
    childCtx = createRenderContext();
    ctx.children.set(key, childCtx);
  }
  return childCtx;
};

const unmount = (
  ctx: RenderContext,
  noRecursive = false,
  willReplaceChild = false,
) => {
  if (!noRecursive) {
    new Set(ctx.children.keys()).forEach((childKey) => {
      const childCtx = ctx.children.get(childKey) as RenderContext;
      ctx.children.delete(childKey);
      unmount(childCtx);
    });
  }

  if (ctx.hooks.length) {
    const prevHooks = ctx.hooks;
    ctx.hooks = [];
    ctx.hookIndex = 0;
    Promise.resolve(() => {
      prevHooks.reverse().forEach((hookCtx) => {
        hookCtx.cleanup?.();
      });
    });
  }

  if (!willReplaceChild && ctx.parent && ctx.node) {
    ctx.parent.removeChild(ctx.node);
  }
};

const renderStack: RenderContext[] = [];

let inRender = 0;

const attachProps = (ele: any, node: any, ctx: RenderContext) => {
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
};

export function render(
  ele: any,
  parent: any,
  ctx: RenderContext = createRenderContext(),
) {
  if (ele === ctx.ele) {
    // TODO test stable element no re-rendering
    if (ctx.node && parent !== ctx.parent) {
      parent.appendChild(ctx.node);
      ctx.parent = parent;
    }
    return;
  }

  ++inRender;
  let node: any = null;

  const willReplaceChild =
    (typeof ele === 'string' ||
      typeof ele === 'number' ||
      typeof ele?.type === 'string') &&
    ctx.parent === parent;
  const prevChildKeys = new Set(ctx.children.keys());
  if (Array.isArray(ele)) {
    ele.forEach((item, index) => {
      const childKey = item?.key ?? index;
      prevChildKeys.delete(childKey);
    });
  } else if (ele?.type) {
    const childKey = ele.key;
    prevChildKeys.delete(childKey);
  }
  prevChildKeys.forEach((childKey) => {
    const childCtx = ctx.children.get(childKey) as RenderContext;
    ctx.children.delete(childKey);
    unmount(childCtx);
  });
  unmount(ctx, true, willReplaceChild);

  if (ele === null || ele === undefined || ele === false) {
    // do nothing
  } else if (typeof ele === 'string' || typeof ele === 'number') {
    node = document.createTextNode(String(ele));
    if (ctx.parent === parent && ctx.node) {
      parent.replaceChild(node, ctx.node);
    } else {
      parent.appendChild(node);
    }
  } else if (Array.isArray(ele)) {
    ele.forEach((item, index) => {
      // TODO test array item key works as expected?
      render(item, parent, childRenderContext(ctx, item?.key ?? index));
    });
  } else if (ele.type === Symbol.for('react.fragment')) {
    render(ele.props.children, parent, childRenderContext(ctx, ele.key));
  } else if (typeof ele.type === 'string') {
    node = document.createElement(ele.type);
    attachProps(ele, node, ctx);
    if (ctx.parent === parent && ctx.node) {
      parent.replaceChild(node, ctx.node);
    } else {
      parent.appendChild(node);
    }
    if (Number.isFinite(ctx.selectionStart) && isTextInput(ele)) {
      node.focus();
      node.setSelectionRange(ctx.selectionStart, ctx.selectionStart);
    }
    render(ele.props.children, node, childRenderContext(ctx, ele.key));
  } else if (typeof ele.type === 'function') {
    ctx.rerender = () => {
      ctx.hookIndex = 0;
      renderStack.unshift(ctx);
      render(ele.type(ele.props), parent, childRenderContext(ctx, ele.key));
      renderStack.shift();
    };
    ctx.rerender();
  } else {
    // console.log('unhandled ele', ele);
    throw new Error(`unhandled ele: ${typeof ele} ${ele?.type}`);
  }

  ctx.ele = ele;
  ctx.parent = parent;
  ctx.node = node;
  --inRender;
}

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
  const hookCtx: HookContext | undefined = ctx.hooks[hookIndex];

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
