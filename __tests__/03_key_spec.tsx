/* eslint quotes: off */
/* eslint no-console: off */

import { render, atom, useAtom } from '../src/index';

describe('key spec', () => {
  const consoleError = console.error;
  beforeEach(() => {
    document.body.innerHTML = '';
    console.error = jest.fn();
  });
  afterEach(() => {
    console.error = consoleError;
  });

  it('array without key', async () => {
    const arrayAtom = atom(['hello', 'jotai']);
    const Component = () => {
      const [array, setArray] = useAtom(arrayAtom);
      return (
        <>
          {array.map((item) => (
            <p>{item}</p>
          ))}
          <button
            type="button"
            onClick={() => {
              if (array[1] === 'jotai') {
                setArray(['hello', 'jsx']);
              } else {
                setArray(['hello']);
              }
            }}
          >
            button
          </button>
        </>
      );
    };
    render(
      <div>
        <Component />
      </div>,
      document.body,
    );
    expect(document.body.innerHTML).toMatchInlineSnapshot(
      `"<div><p>hello</p><p>jotai</p><button type=\\"button\\">button</button></div>"`,
    );
    await Promise.resolve(); // wait for subscription
    document.getElementsByTagName('button')[0].click();
    expect(document.body.innerHTML).toMatchInlineSnapshot(
      `"<div><p>hello</p><p>jsx</p><button type=\\"button\\">button</button></div>"`,
    );
    await Promise.resolve(); // wait for subscription
    document.getElementsByTagName('button')[0].click();
    expect(document.body.innerHTML).toMatchInlineSnapshot(
      `"<div><p>hello</p><button type=\\"button\\">button</button></div>"`,
    );
  });

  it('array with key', async () => {
    const arrayAtom = atom(['hello', 'jotai']);
    const Component = () => {
      const [array, setArray] = useAtom(arrayAtom);
      return (
        <>
          {array.map((item) => (
            <p key={item}>{item}</p>
          ))}
          <button
            type="button"
            onClick={() => {
              if (array[1] === 'jotai') {
                setArray(['jotai', 'hello']);
              } else {
                setArray(['hello']);
              }
            }}
          >
            button
          </button>
        </>
      );
    };
    render(
      <div>
        <Component />
      </div>,
      document.body,
    );
    expect(document.body.innerHTML).toMatchInlineSnapshot(
      `"<div><p>hello</p><p>jotai</p><button type=\\"button\\">button</button></div>"`,
    );
    await Promise.resolve(); // wait for subscription
    document.getElementsByTagName('button')[0].click();
    expect(document.body.innerHTML).toMatchInlineSnapshot(
      `"<div><p>jotai</p><p>hello</p><button type=\\"button\\">button</button></div>"`,
    );
    await Promise.resolve(); // wait for subscription
    document.getElementsByTagName('button')[0].click();
    expect(document.body.innerHTML).toMatchInlineSnapshot(
      `"<div><p>hello</p><button type=\\"button\\">button</button></div>"`,
    );
  });
});
