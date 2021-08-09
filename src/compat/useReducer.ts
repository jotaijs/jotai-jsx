import { useState } from './useState';
import { useCallback } from './useCallback';

export function useReducer<Value, Action, Arg>(
  reducer: (prev: Value, action: Action) => Value,
  initialArg: Arg,
  init: (arg: Arg) => Value,
): readonly [Value, (action: Action) => void];

export function useReducer<Value, Action>(
  reducer: (prev: Value, action: Action) => Value,
  initialValue: Value,
): readonly [Value, (action: Action) => void];

export function useReducer<Value, Action>(
  reducer: (prev: Value, action: Action) => Value,
  initialValue: Value,
  init?: (arg: unknown) => Value,
) {
  const [state, setState] = useState(
    init ? () => init(initialValue) : initialValue,
  );
  const dispatch = useCallback(
    (action: Action) => setState((prev) => reducer(prev, action)),
    [reducer],
  );
  return [state, dispatch] as const;
}
