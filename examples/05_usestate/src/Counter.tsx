/* eslint no-console: off */

import { useState, useEffect } from 'jotai-jsx';

const Counter = ({ name }: { name: string }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    console.log('counter mount', name);
    return () => {
      console.log('counter unmount', name);
    };
  }, [name]);
  useEffect(() => {
    console.log('counter changed', name, count);
  });
  return (
    <div>
      <span>Count: {count}</span>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        +1
      </button>
      <button type="button" onClick={() => setCount((c) => c - 1)}>
        -1
      </button>
    </div>
  );
};

export default Counter;
