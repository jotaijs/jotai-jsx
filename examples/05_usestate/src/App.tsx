import { useState } from 'jotai-jsx';
import Counter from './Counter';

const App = () => {
  const [mode, setMode] = useState<'A' | 'B'>('A');
  return (
    <div>
      <button
        type="button"
        onClick={() => setMode((prev) => (prev === 'A' ? 'B' : 'A'))}
      >
        Toogle
      </button>
      {mode === 'A' && (
        <>
          <h1>Mode A</h1>
          <Counter />
        </>
      )}
      {mode === 'B' && (
        <>
          <h1>Mode B</h1>
          <Counter />
        </>
      )}
    </div>
  );
};

export default App;
