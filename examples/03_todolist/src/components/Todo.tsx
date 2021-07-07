import { memo } from 'jotai-jsx';

import useToggleTodo from '../hooks/useToggleTodo';

type Props = {
  id: number;
  completed: boolean;
  text: string;
};

const Todo = ({ id, completed, text }: Props) => {
  const toggleTodo = useToggleTodo();
  return (
    <li
      onClick={() => toggleTodo(id)}
      role="presentation"
      style={{
        textDecoration: completed ? 'line-through' : 'none',
        cursor: 'pointer',
      }}
    >
      {text} ({Math.random()})
    </li>
  );
};

export default memo(Todo);
