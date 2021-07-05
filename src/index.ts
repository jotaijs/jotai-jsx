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

const cleanupHooks = (ctx: RenderContext) => {
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
};

const renderStack: RenderContext[] = [];

let inRender = 0;

export function render(
  ele: any,
  parent: any,
  ctx: RenderContext = createRenderContext(),
) {
  if (ctx.ele === ele && ctx.parent === parent) {
    // TODO test stable element no re-rendering
    // not changed, do nothing
    return;
  }
  ++inRender;
  if (ele === null || ele === undefined || ele === false) {
    cleanupHooks(ctx);
    if (ctx.parent && ctx.node) {
      ctx.parent.removeChild(ctx.node);
    }
    ctx.ele = ele;
    ctx.parent = parent;
    delete ctx.node;
  } else if (typeof ele === 'string' || typeof ele === 'number') {
    cleanupHooks(ctx);
    const node = document.createTextNode(String(ele));
    if (ctx.node && ctx.parent === parent) {
      parent.replaceChild(node, ctx.node);
    } else {
      if (ctx.parent && ctx.node) {
        ctx.parent.removeChild(ctx.node);
      }
      parent.appendChild(node);
    }
    ctx.ele = ele;
    ctx.parent = parent;
    ctx.node = node;
  } else if (Array.isArray(ele)) {
    cleanupHooks(ctx);
    const prevKeys = new Set(ctx.children.keys());
    ele.forEach((item, index) => {
      // TODO test array item key works as expected?
      const key = item?.key ?? index;
      prevKeys.delete(key);
      render(item, parent, childRenderContext(ctx, key));
    });
    prevKeys.forEach((key) => {
      // TODO test array removal works as expected
      const childCtx = ctx.children.get(key) as RenderContext;
      ctx.children.delete(key);
      cleanupHooks(childCtx);
      if (childCtx.parent && childCtx.node) {
        childCtx.parent.removeChild(childCtx.node);
      }
    });
    ctx.ele = ele;
    ctx.parent = parent;
  } else if (ele.type === Symbol.for('react.fragment')) {
    cleanupHooks(ctx);
    render(ele.props.children, parent, childRenderContext(ctx, ele.key));
    ctx.ele = ele;
    ctx.parent = parent;
  } else if (typeof ele.type === 'string') {
    cleanupHooks(ctx);
    const node = document.createElement(ele.type);
    Object.keys(ele.props).forEach((key) => {
      if (key === 'children') {
        // do nothing
      } else if (
        key === 'onChange' &&
        isTextInput(ele) &&
        'value' in ele.props
      ) {
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
      ctx.parent?.removeChild(ctx.node);
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
    ctx.rerender = () => {
      ctx.hookIndex = 0;
      renderStack.unshift(ctx);
      render(ele.type(ele.props), parent, childRenderContext(ctx, ele.key));
      renderStack.shift();
    };
    ctx.rerender();
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
