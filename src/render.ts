import type { Atom, SetAtom } from './vendor/atom';

type HookContext = {
  cleanup?: () => void;
  atom?: Atom<any>;
  setAtom?: SetAtom<any>;
};

type RenderContext = {
  ele?: any;
  parent?: any;
  node: HTMLElement | Text | null;
  children: Map<unknown, RenderContext>;
  rerender?: (force?: boolean) => void;
  selectionStart?: number; // for text(area) input only
  hooks: HookContext[];
  hookIndex: number;
  force?: boolean;
};

export const renderStack: RenderContext[] = [];

const createRenderContext = () => {
  const ctx: RenderContext = {
    node: null,
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
    delete ctx.parent;
  }
};

let inRender = 0;

const normalizeStyle = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(normalizeStyle).join(';');
  }
  return Object.keys(value as any)
    .map((key) => {
      const styleValue = (value as any)[key];
      if (
        styleValue === null ||
        styleValue === undefined ||
        styleValue === false
      ) {
        return '';
      }
      return `${key.replace(
        /[A-Z]/g,
        (s) => `-${s.toLowerCase()}`,
      )}:${styleValue}`;
    })
    .join(';');
};

const attachProps = (ele: any, node: HTMLElement, ctx: RenderContext) => {
  Object.keys(ele.props).forEach((key) => {
    if (key === 'children') {
      // do nothing
    } else if (
      key === 'onChange' &&
      'value' in ele.props &&
      (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement)
    ) {
      node.addEventListener('input', (event: any) => {
        if (node === ctx.node) {
          ctx.selectionStart = event.target.selectionStart;
          ele.props[key](event);
        }
      });
      node.addEventListener('blur', () => {
        if (node === ctx.node && !inRender) {
          delete ctx.selectionStart;
        }
      });
    } else if (key.startsWith('on')) {
      node.addEventListener(key.slice(2).toLowerCase(), (event: any) => {
        if (node === ctx.node) {
          ele.props[key](event);
        }
      });
    } else if (key === 'style') {
      node.setAttribute(key, normalizeStyle(ele.props[key]));
    } else if (key === 'className') {
      node.setAttribute('class', ele.props[key]);
    } else {
      const propValue = ele.props[key];
      if (
        propValue === null ||
        propValue === undefined ||
        propValue === false
      ) {
        // do nothing (no need to removeAttribute)
      } else {
        node.setAttribute(key, propValue);
      }
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
  let node: HTMLElement | Text | null = null;

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
    attachProps(ele, node as HTMLElement, ctx);
    if (ctx.parent === parent && ctx.node) {
      parent.replaceChild(node, ctx.node);
    } else {
      parent.appendChild(node);
    }
    if (
      Number.isFinite(ctx.selectionStart) &&
      (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement)
    ) {
      // HACK recover focus and cursor position
      node.focus();
      node.setSelectionRange(
        ctx.selectionStart as number,
        ctx.selectionStart as number,
      );
    }
    render(ele.props.children, node, childRenderContext(ctx, ele.key));
  } else if (typeof ele.type === 'function') {
    ctx.rerender = (force?: boolean) => {
      ctx.hookIndex = 0;
      ctx.force = force;
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
