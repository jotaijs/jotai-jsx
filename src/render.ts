import type { Atom, SetAtom } from './vendor/atom';

type UnknownElement =
  | JSX.Element
  | string
  | number
  | boolean
  | null
  | undefined
  | (JSX.Element | string | number | boolean | null | undefined)[];

type HookContext = {
  cleanup?: () => void;
  atom?: Atom<unknown>;
  setAtom?: SetAtom<unknown>;
};

type RenderContext = {
  ele?: UnknownElement;
  parent?: HTMLElement;
  node: HTMLElement | Text | null;
  nextSibling: Node | null;
  key: unknown;
  children: RenderContext[];
  rerender?: (force?: boolean) => void;
  selectionStart: number | null; // for text(area) input only
  hooks: HookContext[];
  hookIndex: number;
  force?: boolean;
};

export const renderStack: RenderContext[] = [];

const createRenderContext = (key?: unknown) => {
  const ctx: RenderContext = {
    node: null,
    nextSibling: null,
    key,
    children: [],
    selectionStart: null,
    hooks: [],
    hookIndex: 0,
  };
  return ctx;
};

const childRenderContext = (ctx: RenderContext, key: unknown) => {
  let childCtx = ctx.children.find((x) => x.key === key);
  if (!childCtx) {
    childCtx = createRenderContext(key);
  }
  return childCtx;
};

// TODO reivew unmount code&behavior
const unmount = (ctx: RenderContext, noRecursive = false) => {
  if (!noRecursive) {
    ctx.children.forEach((childCtx) => {
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
};

const removeAllNodes = (parent: HTMLElement, ctx: RenderContext) => {
  if (parent !== ctx.parent) {
    if (ctx.nextSibling?.parentNode !== parent) {
      ctx.nextSibling = null;
    }
  } else if (ctx.node) {
    if (ctx.parent) {
      if (ctx.node.nextSibling) {
        ctx.nextSibling = ctx.node.nextSibling;
      }
      ctx.parent.removeChild(ctx.node);
      delete ctx.parent;
    }
  } else {
    let nextSibling: Node | null = null;
    ctx.children.forEach((childCtx) => {
      removeAllNodes(parent, childCtx);
      if (childCtx.nextSibling) {
        nextSibling = childCtx.nextSibling;
      }
    });
    ctx.children.forEach((childCtx) => {
      childCtx.nextSibling = nextSibling;
    });
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
  return Object.keys(value as Record<string, unknown>)
    .map((key) => {
      const styleValue = (value as Record<string, unknown>)[key];
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

const attachProps = (
  ele: JSX.Element,
  node: HTMLElement,
  ctx: RenderContext,
) => {
  Object.keys(ele.props).forEach((key) => {
    if (key === 'children') {
      // do nothing
    } else if (
      key === 'onChange' &&
      'value' in ele.props &&
      (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement)
    ) {
      node.addEventListener('input', (event) => {
        if (node === ctx.node) {
          ctx.selectionStart =
            (event.target as HTMLInputElement | HTMLTextAreaElement | undefined)
              ?.selectionStart ?? null;
          ele.props[key](event);
        }
      });
      node.addEventListener('blur', () => {
        if (node === ctx.node && !inRender) {
          ctx.selectionStart = null;
        }
      });
    } else if (key.startsWith('on')) {
      node.addEventListener(key.slice(2).toLowerCase(), (event) => {
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
  ele: UnknownElement,
  parent: HTMLElement,
  ctx: RenderContext = createRenderContext(),
) {
  if (ele === ctx.ele) {
    // TODO test stable element no re-rendering
    if (ctx.node) {
      if (parent !== ctx.parent) {
        parent.insertBefore(ctx.node, ctx.nextSibling);
      }
      return;
    }
  }

  ++inRender;
  let node: HTMLElement | Text | null = null;
  const children: RenderContext[] = [];

  const childrenToUnmount = Array.from(ctx.children);
  if (Array.isArray(ele)) {
    ele.forEach((item, index) => {
      const childKey = (item as { key?: unknown } | undefined)?.key ?? index;
      const foundIndex = childrenToUnmount.findIndex((x) => x.key === childKey);
      if (foundIndex >= 0) {
        childrenToUnmount.splice(foundIndex, 1);
      }
    });
  } else if ((ele as { type?: unknown } | undefined)?.type) {
    const childKey = (ele as { key?: unknown } | undefined)?.key;
    const foundIndex = childrenToUnmount.findIndex((x) => x.key === childKey);
    if (foundIndex >= 0) {
      childrenToUnmount.splice(foundIndex, 1);
    }
  }
  childrenToUnmount.forEach((childCtx) => {
    unmount(childCtx);
  });
  unmount(ctx, true);
  removeAllNodes(parent, ctx);

  if (ele === null || ele === undefined || ele === false || ele === true) {
    // do nothing
  } else if (typeof ele === 'string' || typeof ele === 'number') {
    node = document.createTextNode(String(ele));
    parent.insertBefore(node, ctx.nextSibling);
  } else if (Array.isArray(ele)) {
    ele.forEach((item, index) => {
      // TODO test array item key works as expected?
      const childKey = (item as { key?: unknown } | undefined)?.key ?? index;
      const childCtx = childRenderContext(ctx, childKey);
      children.push(childCtx);
      render(item, parent, childCtx);
    });
  } else if (ele.type === Symbol.for('react.fragment')) {
    const childCtx = childRenderContext(ctx, ele.key);
    children.push(childCtx);
    render(ele.props.children, parent, childCtx);
  } else if (typeof ele.type === 'string') {
    node = document.createElement(ele.type);
    attachProps(ele, node, ctx);
    parent.insertBefore(node, ctx.nextSibling);
    if (
      ctx.selectionStart != null &&
      (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement)
    ) {
      // HACK recover focus and cursor position
      node.focus();
      node.setSelectionRange(ctx.selectionStart, ctx.selectionStart);
    }
    const childCtx = childRenderContext(ctx, ele.key);
    children.push(childCtx);
    render(ele.props.children, node, childCtx);
  } else if (typeof ele.type === 'function') {
    const childCtx = childRenderContext(ctx, ele.key);
    children.push(childCtx);
    ctx.rerender = (force?: boolean) => {
      ctx.hookIndex = 0;
      ctx.force = force;
      renderStack.unshift(ctx);
      render(ele.type(ele.props), parent, childCtx);
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
  ctx.children = children;
  --inRender;
}
