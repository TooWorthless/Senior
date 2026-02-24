import { useReducer } from "react";

// ─── Типы ─────────────────────────────────────────
interface Todo { id: number; text: string; completed: boolean }
type TodoAction =
  | { type: "ADD";    text: string }
  | { type: "TOGGLE"; id: number }
  | { type: "DELETE"; id: number }
  | { type: "CLEAR_COMPLETED" };

interface TodoState { todos: Todo[]; nextId: number }

// ─── Reducer — чистая функция вне компонента ──────
function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case "ADD":
      return {
        todos: [...state.todos, { id: state.nextId, text: action.text, completed: false }],
        nextId: state.nextId + 1,
      };
    case "TOGGLE":
      return {
        ...state,
        todos: state.todos.map(t => t.id === action.id ? { ...t, completed: !t.completed } : t),
      };
    case "DELETE":
      return { ...state, todos: state.todos.filter(t => t.id !== action.id) };
    case "CLEAR_COMPLETED":
      return { ...state, todos: state.todos.filter(t => !t.completed) };
    default:
      return state;
  }
}

export default function UseReducerDemo() {
  const [state, dispatch] = useReducer(todoReducer, {
    todos: [
      { id: 1, text: "Изучить useReducer", completed: true },
      { id: 2, text: "Понять Flux архитектуру", completed: false },
      { id: 3, text: "Написать тесты", completed: false },
    ],
    nextId: 4,
  });

  const [input, setInput] = useState("");

  const handleAdd = () => {
    if (!input.trim()) return;
    dispatch({ type: "ADD", text: input.trim() });
    setInput("");
  };

  const completed = state.todos.filter(t => t.completed).length;

  return (
    <section>
      <h2>useReducer</h2>

      <div className="card">
        <h3>Когда useReducer вместо useState?</h3>
        <div className="code-block">{`// useState → когда state простой или независимый
const [count, setCount] = useState(0);

// useReducer → когда:
// 1. Несколько связанных полей (не хочется много useState)
// 2. Следующий state зависит от предыдущего (complex logic)
// 3. Обновления требуют нескольких sub-значений одновременно
// 4. Логику обновления хочется тестировать отдельно от UI

// useReducer vs useState:
// useState  → локальная, простая, независимая
// useReducer → сложная, связанная, предсказуемая (Redux-стиль)

// dispatch стабилен — не нужен в deps!
// dispatch идентична между рендерами (React гарантирует)`}</div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Todo с useReducer</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            placeholder="Новая задача..." style={{ flex: 1 }} />
          <button className="btn" onClick={handleAdd}>Add</button>
        </div>

        <div style={{ marginBottom: 8 }}>
          {state.todos.map(todo => (
            <div key={todo.id} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
              background: "#21262d", borderRadius: 4, marginBottom: 4,
              opacity: todo.completed ? 0.6 : 1,
            }}>
              <input type="checkbox" checked={todo.completed}
                onChange={() => dispatch({ type: "TOGGLE", id: todo.id })} />
              <span style={{
                flex: 1, fontSize: 13,
                textDecoration: todo.completed ? "line-through" : "none",
              }}>{todo.text}</span>
              <button
                onClick={() => dispatch({ type: "DELETE", id: todo.id })}
                style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 14 }}
              >✕</button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-dim)" }}>
          <span>{completed}/{state.todos.length} выполнено</span>
          {completed > 0 && (
            <button className="btn ghost" style={{ fontSize: 11 }}
              onClick={() => dispatch({ type: "CLEAR_COMPLETED" })}>
              Очистить выполненные
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Reducer тестируется отдельно</h3>
        <div className="code-block">{`// Чистая функция — легко тестировать без React:
test("ADD todo", () => {
  const state = todoReducer({ todos: [], nextId: 1 }, {
    type: "ADD", text: "Test task"
  });
  expect(state.todos).toHaveLength(1);
  expect(state.todos[0].text).toBe("Test task");
  expect(state.todos[0].completed).toBe(false);
});

test("TOGGLE todo", () => {
  const initial = { todos: [{ id: 1, text: "Task", completed: false }], nextId: 2 };
  const state = todoReducer(initial, { type: "TOGGLE", id: 1 });
  expect(state.todos[0].completed).toBe(true);
});

// Это невозможно с useState — логика внутри компонента`}</div>
      </div>
    </section>
  );
}
