import useAddTodo from '../hooks/useAddTodo';

const AddTodo = () => {
  const addTodo = useAddTodo();
  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const text = (e.target as any)[0].value;
          if (!text.trim()) {
            return;
          }
          addTodo(text);
          (e.target as any)[0].value = '';
        }}
      >
        <input />
        <button type="submit">Add Todo</button>
      </form>
    </div>
  );
};

export default AddTodo;
