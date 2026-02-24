import { createElement } from "react";

export default function JsxTransformDemo() {
  return (
    <section>
      <h2>JSX Transform — во что компилируется JSX</h2>

      <div className="card">
        <h3>JSX → JavaScript</h3>
        <div className="code-block">{`// Исходный JSX:
const el = (
  <div className="card" onClick={handleClick}>
    <h1>Hello</h1>
    <p>World</p>
  </div>
);

// Компилируется в (React 17+ new transform):
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

const el = _jsxs("div", {
  className: "card",
  onClick: handleClick,
  children: [
    _jsx("h1", { children: "Hello" }),
    _jsx("p", { children: "World" })
  ]
});

// До React 17 (старый transform, нужен import React):
const el = React.createElement(
  "div",
  { className: "card", onClick: handleClick },
  React.createElement("h1", null, "Hello"),
  React.createElement("p", null, "World")
);`}</div>
      </div>

      <div className="card">
        <h3>React.createElement вручную</h3>
        <p style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 10 }}>
          Это то, что React делает под капотом для каждого JSX элемента:
        </p>
        <ManualJsxDemo />
        <div className="code-block">{`// React.createElement(type, props, ...children)
const h1 = createElement("h1", { style: { color: "var(--blue)" } }, "Rendered manually");
const p  = createElement("p", null, "No JSX, just createElement");
const div = createElement("div", { className: "card" }, h1, p);

// Итоговый React element — просто объект:
{
  $$typeof: Symbol(react.element),
  type: "div",
  key: null,
  ref: null,
  props: {
    className: "card",
    children: [
      { type: "h1", props: { style: {...}, children: "Rendered manually" } },
      { type: "p", props: { children: "No JSX..." } }
    ]
  }
}`}</div>
      </div>

      <div className="card">
        <h3>JSX особенности</h3>
        <div className="code-block">{`// Одно корневое выражение (или Fragment):
return (
  <>
    <Header />
    <Main />
  </>
);
// Fragment компилируется в React.Fragment (пустой тег в DOM)

// JSX — это выражение (expression), не statement:
const el = condition ? <A /> : <B />; // ternary
const el = arr.map(x => <Item key={x.id} {...x} />);
const el = isVisible && <Modal />; // short-circuit

// null, undefined, false, 0 — не рендерятся (кроме 0!)
{0 && <List />}       // ⚠️ рендерит "0"!
{items.length > 0 && <List />} // ✅ безопасно
{Boolean(items.length) && <List />} // ✅ или так

// className, не class (зарезервировано в JS)
<div className="box">
// htmlFor, не for:
<label htmlFor="email">

// Атрибуты в camelCase:
<div onClick={...} tabIndex={0} aria-label="..." data-id="1">`}</div>
      </div>
    </section>
  );
}

// Демонстрация createElement без JSX
function ManualJsxDemo() {
  const el = createElement(
    "div",
    { style: { background: "#1e3a5f", padding: 12, borderRadius: 6 } },
    createElement("strong", { style: { color: "var(--blue)" } }, "Rendered via createElement"),
    createElement("p", { style: { color: "var(--text-dim)", fontSize: 13, marginTop: 4 } }, "Без единой строки JSX"),
  );
  return el;
}
