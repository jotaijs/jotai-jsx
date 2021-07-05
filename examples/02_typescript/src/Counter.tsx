import { atom, useAtom } from 'jotai-jsx';

import { stateAtom, Action } from './state';

const countAtom = atom(
  (get) => get(stateAtom).count,
  (_get, set, action: Action) => set(stateAtom, action),
);

let numRendered = 0;

const Counter = () => {
  const [count, dispatch] = useAtom(countAtom);
  return (
    <div>
      numRendered: {++numRendered}
      <div>
        <span>Count: {count}</span>
        <button type="button" onClick={() => dispatch({ type: 'increment' })}>
          +1
        </button>
        <button type="button" onClick={() => dispatch({ type: 'decrement' })}>
          -1
        </button>
      </div>
    </div>
  );
};

export default Counter;
