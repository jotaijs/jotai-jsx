import { renderStack } from './render';

const defaultAreEqual = (a: any, b: any): boolean => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  return (
    aKeys.length > 0 &&
    aKeys.length === bKeys.length &&
    aKeys.every((k) => Object.is(a[k], b[k]))
  );
};

export function memo<Props, Result>(
  func: (props: Props) => Result,
  areEqual: (a: Props, b: Props) => boolean = defaultAreEqual,
) {
  return (props: Props) => {
    const ctx = renderStack[0];
    if (
      !ctx.force &&
      ctx.memoProps &&
      areEqual(ctx.memoProps as Props, props)
    ) {
      return ctx.memoResult as Result;
    }
    const result = func(props);
    ctx.memoProps = props;
    ctx.memoResult = result;
    return result;
  };
}
