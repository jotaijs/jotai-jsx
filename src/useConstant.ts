import { renderStack } from './render';

export function useConstant<Value>(create: () => Value) {
  const ctx = renderStack[0];
  const { hookIndex } = ctx;
  const hookCtx: typeof renderStack[number]['hooks'][number] | undefined =
    ctx.hooks[hookIndex];

  if (hookCtx) {
    if (!('constant' in hookCtx)) {
      throw new Error('hook order changed');
    }
    return hookCtx.constant;
  }

  const value = create();
  ctx.hooks[hookIndex] = {
    constant: value,
  };

  return value;
}
