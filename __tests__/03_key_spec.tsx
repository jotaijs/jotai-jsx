/* eslint quotes: off */
/* eslint no-console: off */

import { render, memo, atom, useAtom } from '../src/index';

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
    const Paragraph = memo(({ text }: { text: string }) => <p>{text}</p>);
    const Component = () => {
      const [array, setArray] = useAtom(arrayAtom);
      return (
        <>
          {array.map((item) => (
            <Paragraph text={item} />
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
    Array.from(document.getElementsByTagName('p')).forEach((ele) => {
      if (ele.innerHTML === 'hello') {
        ele.setAttribute('style', 'color: red');
      }
    });
    expect(document.body.innerHTML).toMatchInlineSnapshot(
      `"<div><p style=\\"color: red\\">hello</p><p>jotai</p><button type=\\"button\\">button</button></div>"`,
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

  it('array with key', async () => {
    const arrayAtom = atom(['hello', 'jotai']);
    const Paragraph = memo(({ text }: { text: string }) => <p>{text}</p>);
    const Component = () => {
      const [array, setArray] = useAtom(arrayAtom);
      return (
        <>
          {array.map((item) => (
            <Paragraph key={item} text={item} />
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
        end
      </div>,
      document.body,
    );
    Array.from(document.getElementsByTagName('p')).forEach((ele) => {
      if (ele.innerHTML === 'hello') {
        ele.setAttribute('style', 'color: red');
      }
    });
    expect(document.body.innerHTML).toMatchInlineSnapshot(
      `"<div><p style=\\"color: red\\">hello</p><p>jotai</p><button type=\\"button\\">button</button>end</div>"`,
    );
    await Promise.resolve(); // wait for subscription
    document.getElementsByTagName('button')[0].click();
    expect(document.body.innerHTML).toMatchInlineSnapshot(
      `"<div><p>jotai</p><p style=\\"color: red\\">hello</p><button type=\\"button\\">button</button>end</div>"`,
    );
    await Promise.resolve(); // wait for subscription
    document.getElementsByTagName('button')[0].click();
    expect(document.body.innerHTML).toMatchInlineSnapshot(
      `"<div><p style=\\"color: red\\">hello</p><button type=\\"button\\">button</button>end</div>"`,
    );
  });

  it('component returns an array', async () => {
    const arrayAtom = atom(['hello', 'jotai']);
    const Paragraph = memo(({ text }: { text: string }) => <p>{text}</p>);
    const Component = () => {
      const [array] = useAtom(arrayAtom);
      return array.map((item) => <Paragraph key={item} text={item} />) as any;
    };
    const Controls = () => {
      const [array, setArray] = useAtom(arrayAtom);
      return (
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
      );
    };
    render(
      <div>
        <Component />
        <Controls />
      </div>,
      document.body,
    );
    Array.from(document.getElementsByTagName('p')).forEach((ele) => {
      if (ele.innerHTML === 'hello') {
        ele.setAttribute('style', 'color: red');
      }
    });
    expect(document.body.innerHTML).toMatchInlineSnapshot(
      `"<div><p style=\\"color: red\\">hello</p><p>jotai</p><button type=\\"button\\">button</button></div>"`,
    );
    await Promise.resolve(); // wait for subscription
    document.getElementsByTagName('button')[0].click();
    expect(document.body.innerHTML).toMatchInlineSnapshot(
      `"<div><p>jotai</p><p style=\\"color: red\\">hello</p><button type=\\"button\\">button</button></div>"`,
    );
    await Promise.resolve(); // wait for subscription
    document.getElementsByTagName('button')[0].click();
    expect(document.body.innerHTML).toMatchInlineSnapshot(
      `"<div><p style=\\"color: red\\">hello</p><button type=\\"button\\">button</button></div>"`,
    );
  });
});
