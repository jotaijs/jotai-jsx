import { atom } from 'jotai/vanilla';
import { useAtom } from 'jotai-jsx';

import { stateAtom } from '../state';

let nextTodoId = 0;

const addTodoAtom = atom(null, (_get, set, text: string) => {
  set(stateAtom, (prev) => ({
    ...prev,
    todos: [
      ...prev.todos,
      {
        id: nextTodoId++,
        text,
        completed: false,
      },
    ],
  }));
});

const useAddTodo = () => {
  const [, addTodo] = useAtom(addTodoAtom);
  return addTodo;
};

export default useAddTodo;
