import { useState } from 'jotai-jsx';

const Counter = () => {
  const [count, setCount] = useState(0);
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
