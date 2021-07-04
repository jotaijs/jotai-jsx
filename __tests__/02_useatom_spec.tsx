/* eslint quotes: off */

import { render, atom, useAtom } from '../src/index';

describe('useAtom spec', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('default value', () => {
    const countAtom = atom(1);
    const Counter = () => {
      const [count] = useAtom(countAtom);
      return <p>{count}</p>;
    };
    render(<div>body<Counter /></div>, document.body);
    expect(document.body.innerHTML).toMatchInlineSnapshot(`"<div>body<p>1</p></div>"`);
  });

  it('increment value', () => {
    const countAtom = atom(1);
    const Counter = () => {
      const [count, setCount] = useAtom(countAtom);
      return (
        <>
          <p>{count}</p>
          <button
            type="button"
            id="btn01"
            onClick={() => setCount((c) => c + 1)}
          >
            button
          </button>
        </>
      );
    };
    render(<div>body<Counter /></div>, document.body);
    expect(document.body.innerHTML).toMatchInlineSnapshot(`"<div>body<p>1</p><button type=\\"button\\" id=\\"btn01\\">button</button></div>"`);
    document.getElementById('btn01')?.click();
    expect(document.body.innerHTML).toMatchInlineSnapshot(`"<div>body<p>2</p><button type=\\"button\\" id=\\"btn01\\">button</button></div>"`);
  });

  it('flat two counters', () => {
    const countAtom = atom(1);
    const Counter = ({ id }: { id: string }) => {
      const [count, setCount] = useAtom(countAtom);
      return (
        <>
          <p>{count}</p>
          <button
            type="button"
            id={id}
            onClick={() => setCount((c) => c + 1)}
          >
            button
          </button>
        </>
      );
    };
    render(<div>body<Counter id="btn01" />another<Counter id="btn02" /></div>, document.body);
    expect(document.body.innerHTML).toMatchInlineSnapshot(`"<div>body<p>1</p><button type=\\"button\\" id=\\"btn01\\">button</button>another<p>1</p><button type=\\"button\\" id=\\"btn02\\">button</button></div>"`);
    document.getElementById('btn01')?.click();
    expect(document.body.innerHTML).toMatchInlineSnapshot(`"<div>body<p>2</p><button type=\\"button\\" id=\\"btn01\\">button</button>another<p>2</p><button type=\\"button\\" id=\\"btn02\\">button</button></div>"`);
  });
});
