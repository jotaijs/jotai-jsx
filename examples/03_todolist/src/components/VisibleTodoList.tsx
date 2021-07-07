import useVisibleTodos from '../hooks/useVisibleTodos';
import Todo from './Todo';

const VisibleTodoList = () => {
  const visibleTodos = useVisibleTodos();
  return (
    <ul>
      {visibleTodos.map((todo) => (
        <Todo
          key={todo.id}
          id={todo.id}
          completed={todo.completed}
          text={todo.text}
        />
      ))}
    </ul>
  );
};

export default VisibleTodoList;
