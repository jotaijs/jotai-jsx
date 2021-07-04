import { render, atom, useAtom } from 'jotai-jsx';

const countAtom = atom(0);
const textAtom = atom('hello');

let numRendered = 0;

const Counter = () => {
  const [count, setCount] = useAtom(countAtom);
  return (
    <div>
      numRendered: {++numRendered}
      <div>
        <span>Count: {count}</span>
        <button type="button" onClick={() => setCount((c) => c + 1)}>+1</button>
        <button type="button" onClick={() => setCount((c) => c - 1)}>-1</button>
      </div>
    </div>
  );
};

const TextBox = () => {
  const [text, setText] = useAtom(textAtom);
  return (
    <div>
      numRendered: {++numRendered}
      <div>
        <span>Text: {text}</span>
        <input value={text} onChange={(event) => setText(event.target.value)} />
      </div>
    </div>
  );
};

const App = () => (
  <>
    <h1>Counter</h1>
    <Counter />
    <Counter />
    <h1>TextBox</h1>
    <TextBox />
    <TextBox />
  </>
);

render(<App />, document.getElementById('app'));
