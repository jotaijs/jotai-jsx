/* eslint jsx-a11y/anchor-is-valid: off */
/* eslint jsx-a11y/no-static-element-interactions: off */
/* eslint jsx-a11y/click-events-have-key-events: off */

import { memo, atom, useAtom } from 'jotai-jsx';

// prettier-ignore
const A = ['pretty', 'large', 'big', 'small', 'tall', 'short', 'long', 'handsome', 'plain', 'quaint', 'clean', 'elegant', 'easy', 'angry', 'crazy', 'helpful', 'mushy', 'odd', 'unsightly', 'adorable', 'important', 'inexpensive', 'cheap', 'expensive', 'fancy'];
// prettier-ignore
const C = ['red', 'yellow', 'blue', 'green', 'pink', 'brown', 'purple', 'brown', 'white', 'black', 'orange'];
// prettier-ignore
const N = ['table', 'chair', 'house', 'bbq', 'desk', 'car', 'pony', 'cookie', 'sandwich', 'burger', 'pizza', 'mouse', 'keyboard'];

const random = (max: number) => Math.round(Math.random() * 1000) % max;

let nextId = 1;

function buildDataAtoms(count: number) {
  const data = new Array(count);
  for (let i = 0; i < count; i++) {
    data[i] = atom({
      id: nextId++,
      label: `${A[random(A.length)]} ${C[random(C.length)]} ${
        N[random(N.length)]
      }`,
    });
  }
  return data;
}

const dataAtom = atom<any[]>([]);
const selectedAtom = atom<any>(null);

const createRowsAtom = atom(null, (_, set, amount: number) => {
  set(dataAtom, buildDataAtoms(amount));
  set(selectedAtom, null);
});

const appendRowsAtom = atom(null, (_, set) => {
  set(dataAtom, (data) => data.concat(buildDataAtoms(1000)));
});

const updateRowsAtom = atom(null, (get, set) => {
  const data = get(dataAtom);
  for (let i = 0; i < data.length; i += 10) {
    set(data[i], (r: any) => ({ id: r.id, label: `${r.label} !!!` }));
  }
});

const removeRowAtom = atom(null, (_, set, item) =>
  set(dataAtom, (data) => {
    const idx = data.findIndex((d) => d === item);
    return [...data.slice(0, idx), ...data.slice(idx + 1)];
  }),
);

const selectRowAtom = atom(null, (get, set, selected: any) => {
  const prevSelected: any = get(selectedAtom);
  if (prevSelected === selected) {
    return;
  }
  if (prevSelected) {
    set(prevSelected, (prev: any) => ({ ...prev, isSelected: false }));
  }
  set(selected, (prev: any) => ({ ...prev, isSelected: true }));
  set(selectedAtom, selected);
});

const clearStateAtom = atom(null, (_, set) => {
  set(dataAtom, []);
  set(selectedAtom, null);
});

const swapRowsAtom = atom(null, (get, set) => {
  const data = get(dataAtom);
  if (data.length > 998) {
    set(dataAtom, [
      data[0],
      data[998],
      ...data.slice(2, 998),
      data[1],
      data[999],
    ]);
  }
});

const GlyphIcon = (
  <span className="glyphicon glyphicon-remove" aria-hidden="true" />
);

const Row = memo(({ item }: any) => {
  const [{ id, label, isSelected }] = useAtom(item) as any;
  const [, selectRow] = useAtom(selectRowAtom);
  const [, removeRow] = useAtom(removeRowAtom);
  return (
    <tr className={isSelected ? 'danger' : ''}>
      <td className="col-md-1">{id}</td>
      <td className="col-md-4">
        <a onClick={() => selectRow(item)}>{label}</a>
      </td>
      <td className="col-md-1">
        <a onClick={() => removeRow(item)}>{GlyphIcon}</a>
      </td>
      <td className="col-md-6" />
    </tr>
  );
});

const RowList = memo(() => {
  const [data] = useAtom(dataAtom);
  return (
    <>
      {data.map((item) => (
        <Row key={String(item)} item={item} />
      ))}
    </>
  );
});

const Button = memo(({ id, title, cb }: any) => (
  <div className="col-sm-6 smallpad">
    <button
      type="button"
      className="btn btn-primary btn-block"
      id={id}
      onClick={cb}
    >
      {title}
    </button>
  </div>
));

const App = () => {
  const [, createRows] = useAtom(createRowsAtom);
  const [, appendRows] = useAtom(appendRowsAtom);
  const [, updateRows] = useAtom(updateRowsAtom);
  const [, clearState] = useAtom(clearStateAtom);
  const [, swapRows] = useAtom(swapRowsAtom);

  return (
    <div className="container">
      <div className="jumbotron">
        <div className="row">
          <div className="col-md-6">
            <h1>jotai-jsx</h1>
          </div>
          <div className="col-md-6">
            <div className="row">
              <Button
                id="run"
                title="Create 1,000 rows"
                cb={() => createRows(1000)}
              />
              <Button
                id="runlots"
                title="Create 10,000 rows"
                cb={() => createRows(10000)}
              />
              <Button id="add" title="Append 1,000 rows" cb={appendRows} />
              <Button
                id="update"
                title="Update every 10th row"
                cb={updateRows}
              />
              <Button id="clear" title="Clear" cb={clearState} />
              <Button id="swaprows" title="Swap Rows" cb={swapRows} />
            </div>
          </div>
        </div>
      </div>
      <table className="table table-hover table-striped test-data">
        <tbody>
          <RowList />
        </tbody>
      </table>
    </div>
  );
};

export default App;
