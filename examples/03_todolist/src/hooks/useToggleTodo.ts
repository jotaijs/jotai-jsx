import { atom } from 'jotai';
import { useAtom } from 'jotai-jsx';

import { stateAtom } from '../state';

const toggleTodoAtom = atom(null, (_get, set, id: number) => {
  set(stateAtom, (prev) => ({
    ...prev,
    todos: prev.todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo,
    ),
  }));
});

const useToggleTodo = () => {
  const [, toggleTodo] = useAtom(toggleTodoAtom);
  return toggleTodo;
};

export default useToggleTodo;
