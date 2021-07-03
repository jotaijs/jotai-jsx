/* eslint quotes: off */

import { render } from '../src/index';

describe('basic spec', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('plain jsx', () => {
    render(<div><h1>title</h1>body</div>, document.body);
    expect(document.body.innerHTML).toMatchInlineSnapshot(`"<div><h1>title</h1>body</div>"`);
  });

  it('string component', () => {
    const Component = () => 'aaa' as any;
    render(<div><h1>title</h1>body<Component /></div>, document.body);
    expect(document.body.innerHTML).toMatchInlineSnapshot(`"<div><h1>title</h1>bodyaaa</div>"`);
  });

  it('p component', () => {
    const Component = () => <p>aaa</p>;
    render(<div><h1>title</h1>body<Component /></div>, document.body);
    expect(document.body.innerHTML).toMatchInlineSnapshot(`"<div><h1>title</h1>body<p>aaa</p></div>"`);
  });
});
