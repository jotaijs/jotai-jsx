import { atom } from 'jotai';
import { useAtom } from 'jotai-jsx';

import { stateAtom, Action } from './state';

const personAtom = atom(
  (get) => get(stateAtom).person,
  (_get, set, action: Action) => set(stateAtom, action),
);

let numRendered = 0;

const Person = () => {
  const [person, dispatch] = useAtom(personAtom);
  return (
    <div>
      numRendered: {++numRendered}
      <div>
        First Name:
        <input
          value={person.firstName}
          onChange={(event) => {
            const firstName = event.target.value;
            dispatch({ firstName, type: 'setFirstName' });
          }}
        />
      </div>
      <div>
        Last Name:
        <input
          value={person.lastName}
          onChange={(event) => {
            const lastName = event.target.value;
            dispatch({ lastName, type: 'setLastName' });
          }}
        />
      </div>
      <div>
        Age:
        <input
          value={person.age}
          onChange={(event) => {
            const age = Number(event.target.value) || 0;
            dispatch({ age, type: 'setAge' });
          }}
        />
      </div>
    </div>
  );
};

export default Person;
