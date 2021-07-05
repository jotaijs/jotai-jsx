import { atom } from 'jotai-jsx';

const initialState = {
  count: 0,
  person: {
    age: 0,
    firstName: '',
    lastName: '',
  },
};

type State = typeof initialState;

export type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'setFirstName'; firstName: string }
  | { type: 'setLastName'; lastName: string }
  | { type: 'setAge'; age: number };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'increment':
      return {
        ...state,
        count: state.count + 1,
      };
    case 'decrement':
      return {
        ...state,
        count: state.count - 1,
      };
    case 'setFirstName':
      return {
        ...state,
        person: {
          ...state.person,
          firstName: action.firstName,
        },
      };
    case 'setLastName':
      return {
        ...state,
        person: {
          ...state.person,
          lastName: action.lastName,
        },
      };
    case 'setAge':
      return {
        ...state,
        person: {
          ...state.person,
          age: action.age,
        },
      };
    default:
      throw new Error('unknown action type');
  }
};

// atomWithReducer equivalent
export const stateAtom = atom(initialState, (get, set, action: Action) => {
  set(stateAtom, reducer(get(stateAtom), action) as any);
});
