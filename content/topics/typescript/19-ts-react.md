---
title: "TypeScript with React (props, state, events, refs)"
stack: typescript
order: 19
level: Intermediate
mustKnow: true
askedFrequency: very common
summary:
  - Describe a component's props with a type. TypeScript then checks every place the component is used.
  - "Type state when it can't be guessed: useState<Candidate[]>([]) means a list of candidates, starting empty."
  - "Events have ready-made types: ChangeEvent<HTMLInputElement>, FormEvent<HTMLFormElement>, MouseEvent<HTMLButtonElement>."
  - "Refs: useRef<HTMLInputElement>(null). In React 19, ref is a normal prop, so forwardRef is no longer needed."
  - "ComponentProps<'button'> gives you all the normal props of an HTML element, to build wrapper components."
cards:
  - q: How do you type a component's props?
    a: "Write a type (or interface) for the props and use it in the function: function Card({ name }: CardProps). Optional props get a ?."
  - q: When do you need a type for useState?
    a: "When TypeScript can't guess it from the starting value, like an empty list or null: useState<Candidate[]>([]) or useState<User | null>(null)."
  - q: How do you type an input's onChange handler?
    a: "(e: ChangeEvent<HTMLInputElement>) => { … }. Then e.target.value is known to be a string."
  - q: How do you type children?
    a: "children?: ReactNode. ReactNode means anything React can show: text, elements, lists, null."
  - q: What changed for refs in React 19?
    a: "Function components can take ref as a normal prop. You type it with ComponentProps<'input'> (or Ref<HTMLInputElement>), and forwardRef is no longer needed."
---

## 💡 What is it?

In React with TypeScript, you write down the **shape** of a component's [props](glossary:props), [state](glossary:state), events and refs.

Then TypeScript checks every place the component is used. A wrong prop shows a red line in the editor, **before** the app runs.

You use `.tsx` files for components that contain JSX.

## 🏠 Real-life example

Think of an **order form at a school canteen**.

- The **printed form** = the props type. It lists exactly what you must fill in: name, class, item.
- A box marked **"(optional)"** = a prop with `?`, like `status?`.
- A **tick box with only 3 choices** = a union type: `'applied' | 'shortlisted' | 'rejected'`.
- The **cashier checking the form** = TypeScript checking each `<CandidateCard ... />`.
- If you write "three" in the "quantity" box, the cashier says **"numbers only"**. That's a type error.

## 🧑‍💻 Code example

Install with `npm install react` and `npm install -D typescript @types/react`, and set `"jsx": "react-jsx"` in `tsconfig.json`. Save the file as `CandidateCard.tsx` and run `npx tsc --noEmit` to check it.

```tsx
import { useRef, useState, type ComponentProps, type ReactNode, type ChangeEvent } from 'react'; // hooks + type helpers

type Status = 'applied' | 'shortlisted' | 'rejected';      // only these 3 words are allowed

type CandidateCardProps = {                                  // the props this component accepts
  name: string;                                              // text, required
  experience: number;                                        // a number, like 3
  status?: Status;                                           // ? = optional
  onSelect: (name: string) => void;                          // a function that takes a name and returns nothing
  children?: ReactNode;                                      // anything React can show
};

export function CandidateCard({ name, experience, status = 'applied', onSelect, children }: CandidateCardProps) { // props typed by CandidateCardProps
  const [notes, setNotes] = useState<string[]>([]);          // state: a list of strings, starts empty
  const inputRef = useRef<HTMLInputElement>(null);           // ref to an <input>, null until it is on screen

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => { // typed change event of an input
    if (e.target.value.endsWith('.')) setNotes([...notes, e.target.value]); // save a note when it ends with a dot
  };

  return (                                                   // what the card shows
    <div onClick={() => onSelect(name)}>                    {/* click → tell the parent which candidate */}
      <h3>{name} · {experience} yrs · {status}</h3>         {/* typed values shown on screen */}
      <input ref={inputRef} onChange={handleChange} />      {/* the ref and handler types match <input> */}
      {children}                                             {/* extra content from the parent */}
    </div>                                                   // end of the card
  );                                                         // end of return
}                                                            // end of CandidateCard

type ButtonProps = ComponentProps<'button'> & { variant: 'primary' | 'ghost' }; // all normal <button> props + our own
export function Button({ variant, ...rest }: ButtonProps) {  // take variant out, keep the rest
  return <button data-variant={variant} {...rest} />;        // pass every normal button prop through
}                                                            // end of Button

export const ok = <CandidateCard name="Asha" experience={3} onSelect={(n) => console.log(n)} />; // correct use
export const wrong = <CandidateCard name="Ravi" experience="three" status="hired" onSelect={() => {}} />; // two mistakes on purpose
```

**Output of `npx tsc --noEmit`:**

```text
CandidateCard.tsx(36,49): error TS2322: Type 'string' is not assignable to type 'number'.
CandidateCard.tsx(36,68): error TS2322: Type '"hired"' is not assignable to type 'Status | undefined'.
```

The correct use (`ok`) has no errors. The two mistakes on the last line are caught before the app ever runs.

## 🔍 Deeper version

**Props: `type` or `interface`?** Both work. Many React teams use `type`, because it handles unions easily, for example props that are either a link or a button. Stay consistent within a project. See [type vs interface](topic:typescript/type-vs-interface).

**State.** TypeScript guesses from the starting value. `useState(0)` is a `number`. Give a type when the start value doesn't tell the full story:
- `useState<Candidate[]>([])`: an empty list of candidates.
- `useState<User | null>(null)`: no user yet, a user later.

**Event types to remember:**

| Handler | Type |
|---|---|
| `onChange` on an input | `ChangeEvent<HTMLInputElement>` |
| `onSubmit` on a form | `FormEvent<HTMLFormElement>` |
| `onClick` on a button | `MouseEvent<HTMLButtonElement>` |
| `onKeyDown` | `KeyboardEvent<HTMLInputElement>` |

A trick: write the handler inline (`onChange={(e) => ...}`) and hover over `e`. The editor shows the exact type.

**Refs.**
- A DOM ref: `useRef<HTMLInputElement>(null)`. It is `null` until the element is on screen, so check `inputRef.current` before using it.
- A value ref (like a timer id): `useRef<number | null>(null)`.

**React 19: `ref` is a normal prop.** Function components can receive `ref` directly:

```tsx
function TextInput({ ref, ...rest }: ComponentProps<'input'>) {  // ref arrives like any other prop
  return <input ref={ref} {...rest} />;                          // pass it to the real <input>
}
```

Before React 19, you needed `forwardRef` for this. You'll still see it in older code.

**Wrapper components.** `ComponentProps<'button'>` gives you **all** the normal button props (`onClick`, `disabled`, `type`, `aria-*`…). Add your own with `&`, then pass the rest through with `...rest`. This is how design-system buttons and inputs are typed.

**Generic components.** A table or a select list can be generic: `function List<T>({ items, render }: { items: T[]; render: (item: T) => ReactNode })`. Each use then keeps its own item type. See [generics](topic:typescript/generics).

**Types vanish at runtime.** Props from your own code are checked at compile time. But data from an API is not checked by these types at all. Validate it with [Zod](topic:typescript/zod) at the edge.

## 🎯 Why do we use it?

- **Wrong props are caught in the editor**, not by a user clicking around.
- **Refactoring is safe.** Rename a prop, and every component that uses it turns red.
- **Autocomplete** shows each component's props, so the types work as live documentation.
- In big apps with many developers, the props type is the **contract** between components.

## ⚠️ Common mistakes

- **`useState([])` with no type.** TypeScript infers `never[]`, and you can't add items. Write `useState<Candidate[]>([])`.
- **Typing events as `any`.** You lose `e.target.value` checking. Use the event types above.
- **Using `React.FC` everywhere.** It's fine but unnecessary. Typing the props parameter directly is simpler and the common style today.
- **Trusting API data because "it's typed".** `const data: Job[] = await res.json()` is just an assertion. Nothing checked it.

## 🗣️ How to answer in an interview

> "In React with TypeScript, I type each component's props with a type alias, using optional props with a question mark and union types for fixed values like a status. TypeScript then checks every place the component is used.
>
> For state, I add a generic when the initial value isn't enough, like `useState<Candidate[]>([])` or `useState<User | null>(null)`. Events use React's types, like `ChangeEvent<HTMLInputElement>`, and DOM refs use `useRef<HTMLInputElement>(null)`. In React 19, ref is a normal prop, so I don't need forwardRef anymore. For wrapper components I use `ComponentProps<'button'>` and spread the rest of the props.
>
> One thing I'm careful about is API data. Types disappear at runtime, so I validate responses instead of just typing them."

[FILL IN: one real example from the SkillKeepr React screens — e.g. a component or Redux slice you typed. Only if it's true.]

## 🔁 Follow-up questions

### How do you type a component that accepts children?

Add `children?: ReactNode` to the props type. `ReactNode` covers text, elements, arrays, `null` and `undefined`. For a component that **must** have one element, use `ReactElement` instead.

### How do you type a custom hook?

Type its parameters and let TypeScript infer the return value. Or write it explicitly, like `function useFetch<T>(url: string): { data: T | null; loading: boolean; error: string | null }`. Generics let each caller choose `T`.

### How do you type Redux state and dispatch?

With Redux Toolkit, export `RootState = ReturnType<typeof store.getState>` and `AppDispatch = typeof store.dispatch`. Then make typed hooks with `useSelector.withTypes<RootState>()` and `useDispatch.withTypes<AppDispatch>()`.

### Why might a ref's `.current` be `null`?

On the first render, React hasn't created the DOM element yet. And after the component unmounts, React sets it back to `null`. So check `if (inputRef.current)` before using it, usually inside an effect or an event handler.

## ✅ Quick check

### 1. What is the type of `items` here?

```tsx
const [items, setItems] = useState([]);   // no generic given
```

:::answer
**`never[]`**, so you can't add anything to it. Write `useState<string[]>([])`, with the right item type.
:::

### 2. Which type fits `onSubmit` on a `<form>`?

- A) `ChangeEvent<HTMLFormElement>`
- B) `FormEvent<HTMLFormElement>`
- C) `MouseEvent<HTMLFormElement>`

:::answer
**B.** `FormEvent<HTMLFormElement>`. Call `e.preventDefault()` to stop the page from reloading.
:::

### 3. True or false: in React 19, you must wrap a component in `forwardRef` to pass it a `ref`.

:::answer
**False.** In React 19, function components receive `ref` as a normal prop. `forwardRef` still works, but it's no longer needed.
:::
