import { atom } from 'jotai';

export type VisibilityFilterType =
  | 'SHOW_ALL'
  | 'SHOW_COMPLETED'
  | 'SHOW_ACTIVE';

export type TodoType = {
  id: number;
  text: string;
  completed: boolean;
};

type State = {
  todos: TodoType[];
  visibilityFilter: VisibilityFilterType;
};

const initialState: State = {
  todos: [],
  visibilityFilter: 'SHOW_ALL',
};

export const stateAtom = atom(initialState);
