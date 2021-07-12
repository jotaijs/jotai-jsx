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
    render(
      <div>
        body
        <Counter />
      </div>,
      document.body,
    );
    expect(document.body.innerHTML).toMatchInlineSnapshot(
      `"<div>body<p>1</p></div>"`,
    );
  });

  it('increment value', async () => {
    const countAtom = atom(1);
    const Counter = () => {
      const [count, setCount] = useAtom(countAtom);
      return (
        <>
          <p>{count}</p>
          <button type="button" onClick={() => setCount((c) => c + 1)}>
            button
          </button>
        </>
      );
    };
    render(
      <div>
        body
        <Counter />
      </div>,
      document.body,
    );
    expect(document.body.innerHTML).toMatchInlineSnapshot(
      `"<div>body<p>1</p><button type=\\"button\\">button</button></div>"`,
    );
    await Promise.resolve(); // wait for subscription
    document.getElementsByTagName('button')[0].click();
    expect(document.body.innerHTML).toMatchInlineSnapshot(
      `"<div>body<p>2</p><button type=\\"button\\">button</button></div>"`,
    );
  });

  it('flat two counters', async () => {
    const countAtom = atom(1);
    const Counter = () => {
      const [count, setCount] = useAtom(countAtom);
      return (
        <>
          <p>{count}</p>
          <button type="button" onClick={() => setCount((c) => c + 1)}>
            button
          </button>
        </>
      );
    };
    render(
      <div>
        body
        <Counter />
        another
        <Counter />
      </div>,
      document.body,
    );
    expect(document.body.innerHTML).toMatchInlineSnapshot(
      `"<div>body<p>1</p><button type=\\"button\\">button</button>another<p>1</p><button type=\\"button\\">button</button></div>"`,
    );
    await Promise.resolve(); // wait for subscription
    document.getElementsByTagName('button')[1].click();
    expect(document.body.innerHTML).toMatchInlineSnapshot(
      `"<div>body<p>2</p><button type=\\"button\\">button</button>another<p>2</p><button type=\\"button\\">button</button></div>"`,
    );
  });

  it('mount/unmount component', async () => {
    const visibleAtom = atom(true);
    const Component = () => {
      const [visible, setVisible] = useAtom(visibleAtom);
      return (
        <>
          {visible ? 'visible' : null}
          <button
            type="button"
            onClick={() => {
              setVisible((prevVisible) => !prevVisible);
            }}
          >
            toggle
          </button>
        </>
      );
    };
    render(
      <>
        <Component />
      </>,
      document.body,
    );
    expect(document.body.innerHTML).toMatchInlineSnapshot(
      `"visible<button type=\\"button\\">toggle</button>"`,
    );
    await Promise.resolve(); // wait for subscription
    document.getElementsByTagName('button')[0].click();
    expect(document.body.innerHTML).toMatchInlineSnapshot(
      `"<button type=\\"button\\">toggle</button>"`,
    );
  });
});
