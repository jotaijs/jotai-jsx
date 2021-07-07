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
  // FIXME potential memory leaks, use weak ref?
  const cache: [Props, Result][] = [];
  return (props: Props) => {
    const found = cache.find((item) => areEqual(item[0], props));
    if (found) {
      return found[1];
    }
    const result = func(props);
    cache.push([props, result]);
    return result;
  };
}
