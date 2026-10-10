---
title: "Hands-on: build theme, logged-in user and cart with Context API"
stack: redux-context
order: 18
level: Basic
mustKnow: true
askedFrequency: common
summary:
  - "Build three contexts in one small app: ThemeContext (light/dark), AuthContext (fake login) and CartContext (useReducer)."
  - "Give every context its own custom hook (useTheme, useAuth, useCart) that throws a clear error when the Provider is missing."
  - Memoise the provider value with useMemo and useCallback, so readers don't re-render for nothing.
  - "Split data and dispatch into two contexts: components that only click buttons never re-render when the cart changes."
  - Keep the reducer in its own plain .js file, so you can test it in Node without React.
cards:
  - q: Why write a custom hook like useAuth() instead of calling useContext(AuthContext) everywhere?
    a: One import for every component, one place to change later, and a clear error message if someone forgets the Provider.
  - q: Why wrap the provider value in useMemo?
    a: Without it, a new object is made on every render of the provider, so every reader re-renders even when nothing changed.
  - q: Why put the cart's dispatch in a separate context from the cart data?
    a: dispatch never changes. Components that only send actions (like an "Add" button list) then don't re-render when the cart data changes.
  - q: Where does the cart state actually live?
    a: In useReducer inside CartProvider. Context only passes the state and dispatch down; it doesn't store anything itself.
  - q: How do you test the cart logic?
    a: Keep the reducer as a pure function in its own file and call it directly in Node or Jest, with no React needed.
---

## 💡 What is it?

This is a **practice project**. You build a tiny shop page that shares [state](glossary:state) with Context in three ways:

1. **ThemeContext**: a light/dark switch.
2. **AuthContext**: a fake login that stores a user.
3. **CartContext**: a cart that uses [useReducer](topic:react/use-reducer).

You already know the basics from [Context API](topic:redux-context/context-api). This page turns that into working code you build yourself. After building it once, you can explain Context with confidence.

## 🏠 Real-life example

Think of a **school building** with three notice boards in the hallway.

- **Board 1: "Today's uniform: sports / normal"** = ThemeContext. Everyone can read it.
- **Board 2: "Class monitor: Hari"** = AuthContext. It says who is in charge right now.
- **Board 3: "Lost-and-found box"** = CartContext. Students put things in and take things out.
- **The school office** keeps the boards updated = the Provider components.
- **A rule: "only read boards inside the building"** = the custom hook that throws an error outside the Provider.
- **Separate boards for separate news** = splitting contexts. A change on the lost-and-found board doesn't make everyone re-read the uniform board.

## 🧑‍💻 Code example

**Set up the project:**

```bash
npm create vite@latest context-shop -- --template react   # make a new React app with Vite
cd context-shop                                            # go into the folder
npm install                                                # install React and Vite
npm run dev                                                # start it, then open the URL it prints
```

**Folder structure:**

```text
src/
├── context/
│   ├── ThemeContext.jsx    ← light/dark theme
│   ├── AuthContext.jsx     ← fake login
│   ├── cartReducer.js      ← pure cart logic (no React)
│   └── CartContext.jsx     ← cart state + dispatch
├── components/
│   ├── Header.jsx
│   ├── ProductList.jsx
│   └── CartSummary.jsx
├── App.jsx
└── main.jsx
```

**Step 1: `src/context/ThemeContext.jsx`**

```jsx
import { createContext, useContext, useMemo, useState } from 'react'; // React tools we need

const ThemeContext = createContext(null);                     // the "notice board"; null = no provider above

export function ThemeProvider({ children }) {                  // wraps part of the app and shares the theme
  const [theme, setTheme] = useState('light');                 // 'light' is the starting theme
  const value = useMemo(() => ({                               // useMemo: make a NEW object only when theme changes
    theme,                                                     // the current theme: 'light' or 'dark'
    toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')), // flip between the two
  }), [theme]);                                                // [theme] = rebuild only when theme changes
  return <ThemeContext value={value}>{children}</ThemeContext>; // React 19: the context itself is the provider
}                                                              // end of ThemeProvider

export function useTheme() {                                   // custom hook: the only way components read the theme
  const ctx = useContext(ThemeContext);                        // read the nearest provider's value
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>'); // clear error if we forgot the provider
  return ctx;                                                  // { theme, toggleTheme }
}                                                              // end of useTheme
```

**Step 2: `src/context/AuthContext.jsx`**

```jsx
import { createContext, useCallback, useContext, useMemo, useState } from 'react'; // React tools we need

const AuthContext = createContext(null);                       // shares the logged-in user; null = no provider

export function AuthProvider({ children }) {                    // wraps the app and shares login state
  const [user, setUser] = useState(null);                       // null = nobody is logged in
  const login = useCallback((name) => setUser({ id: 1, name }), []); // fake login: just save a user object
  const logout = useCallback(() => setUser(null), []);          // logout: forget the user
  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]); // new object only when user changes
  return <AuthContext value={value}>{children}</AuthContext>;   // share it with everything inside
}                                                               // end of AuthProvider

export function useAuth() {                                     // custom hook for login state
  const ctx = useContext(AuthContext);                          // read the nearest AuthProvider
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>'); // helpful error message
  return ctx;                                                   // { user, login, logout }
}                                                               // end of useAuth
```

**Step 3: `src/context/cartReducer.js`** (a [reducer](glossary:reducer) in plain JavaScript, no React)

```js
export const initialCart = { items: [] };                       // empty cart: no items yet

export function cartReducer(state, action) {                    // (old state, action) → new state, never changes old state
  switch (action.type) {                                        // decide what to do by the action's type
    case 'add': {                                               // add one unit of a product
      const found = state.items.find((i) => i.id === action.product.id); // is it already in the cart?
      if (found) {                                              // yes → just increase its quantity
        return { items: state.items.map((i) => (i.id === found.id ? { ...i, qty: i.qty + 1 } : i)) }; // copy, don't mutate
      }                                                         // end of "already in cart"
      return { items: [...state.items, { ...action.product, qty: 1 }] }; // no → add it with qty 1
    }                                                           // end of 'add'
    case 'remove':                                              // remove a product completely
      return { items: state.items.filter((i) => i.id !== action.id) }; // keep every item except this one
    case 'clear':                                               // empty the cart (e.g. on logout)
      return initialCart;                                       // back to the start
    default:                                                    // an action we don't know
      throw new Error(`Unknown cart action: ${action.type}`);   // fail loudly so typos are caught
  }                                                             // end of switch
}                                                               // end of cartReducer

export const cartTotal = (state) => state.items.reduce((sum, i) => sum + i.price * i.qty, 0); // price × qty, added up
```

**Step 4: `src/context/CartContext.jsx`** (two contexts: data and dispatch)

```jsx
import { createContext, useContext, useReducer } from 'react';   // React tools we need
import { cartReducer, initialCart } from './cartReducer.js';     // the pure reducer (tested in Node)

const CartStateContext = createContext(null);                    // context 1: the cart DATA (changes often)
const CartDispatchContext = createContext(null);                 // context 2: the dispatch FUNCTION (never changes)

export function CartProvider({ children }) {                      // wraps the app and shares the cart
  const [state, dispatch] = useReducer(cartReducer, initialCart); // state = cart, dispatch = send an action
  return (                                                        // two providers, one inside the other
    <CartDispatchContext value={dispatch}>                        {/* dispatch is stable, so this never re-renders readers */}
      <CartStateContext value={state}>{children}</CartStateContext> {/* state changes when the cart changes */}
    </CartDispatchContext>                                        // end of the dispatch provider
  );                                                              // end of return
}                                                                 // end of CartProvider

export function useCart() {                                       // read the cart data
  const ctx = useContext(CartStateContext);                       // nearest CartProvider's state
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>'); // helpful error
  return ctx;                                                     // { items: [...] }
}                                                                 // end of useCart

export function useCartDispatch() {                               // read only the dispatch function
  const ctx = useContext(CartDispatchContext);                    // nearest CartProvider's dispatch
  if (!ctx) throw new Error('useCartDispatch must be used inside <CartProvider>'); // helpful error
  return ctx;                                                     // dispatch({ type, ... })
}                                                                 // end of useCartDispatch
```

**Test the reducer in Node.** Save this as `test-reducer.mjs` in the project folder and run `node test-reducer.mjs`.

```js
import { cartReducer, initialCart, cartTotal } from './src/context/cartReducer.js'; // the pure reducer
const notebook = { id: 1, name: 'Notebook', price: 50 };                          // product 1, ₹50
const pen = { id: 2, name: 'Pen', price: 20 };                                    // product 2, ₹20
let s = initialCart;                                                              // start empty
s = cartReducer(s, { type: 'add', product: notebook });                           // add notebook
s = cartReducer(s, { type: 'add', product: notebook });                           // add notebook again → qty 2
s = cartReducer(s, { type: 'add', product: pen });                                // add pen
console.log('items:', s.items.map((i) => `${i.name}×${i.qty}`).join(', '));      // what is in the cart
console.log('total:', cartTotal(s));                                              // 50×2 + 20 = 120
const before = s;                                                                 // remember this state
s = cartReducer(s, { type: 'remove', id: 1 });                                    // remove notebook
console.log('after remove:', s.items.map((i) => i.name), '| old state unchanged:', before.items.length === 2); // no mutation
try { cartReducer(s, { type: 'oops' }); } catch (e) { console.log('error:', e.message); } // unknown action
```

**Output:**

```text
items: Notebook×2, Pen×1
total: 120
after remove: [ 'Pen' ] | old state unchanged: true
error: Unknown cart action: oops
```

## 🔍 Deeper version

**Step 5: the components.** Each one reads only the contexts it needs.

`src/components/Header.jsx`:

```jsx
import { useTheme } from '../context/ThemeContext.jsx';          // read the theme
import { useAuth } from '../context/AuthContext.jsx';            // read the login state

export default function Header() {                                // top bar: theme button + login
  const { theme, toggleTheme } = useTheme();                      // current theme and the flip function
  const { user, login, logout } = useAuth();                      // current user and login/logout functions
  return (                                                        // what the header shows
    <header>                                                      {/* top bar */}
      <button onClick={toggleTheme}>Theme: {theme}</button>       {/* click → light/dark */}
      {user ? (                                                   // is someone logged in?
        <button onClick={logout}>Log out {user.name}</button>     // yes → show their name and a logout button
      ) : (                                                       // no →
        <button onClick={() => login('Hari')}>Log in</button>     // fake login as "Hari"
      )}                                                          {/* end of the login choice */}
    </header>                                                     // end of top bar
  );                                                              // end of return
}                                                                 // end of Header
```

`src/components/ProductList.jsx` uses **only dispatch**, so cart changes don't re-render it:

```jsx
import { memo } from 'react';                                     // memo: skip re-render when props don't change
import { useCartDispatch } from '../context/CartContext.jsx';     // only the dispatch function, not the cart data

const PRODUCTS = [                                                // fake products (would come from an API)
  { id: 1, name: 'Notebook', price: 50 },                         // product 1, price ₹50
  { id: 2, name: 'Pen', price: 20 },                              // product 2, price ₹20
];                                                                // end of PRODUCTS

function ProductList() {                                          // list of products with "Add" buttons
  const dispatch = useCartDispatch();                             // stable function → no re-render when the cart changes
  console.log('ProductList rendered');                            // watch the console to see how often it renders
  return (                                                        // what the list shows
    <ul>                                                          {/* product list */}
      {PRODUCTS.map((p) => (                                      // one row per product
        <li key={p.id}>                                           {/* key = stable product id */}
          {p.name} ₹{p.price}                                     {/* name and price */}
          <button onClick={() => dispatch({ type: 'add', product: p })}>Add</button> {/* send an "add" action */}
        </li>                                                     // end of row
      ))}                                                         {/* end of map */}
    </ul>                                                         // end of list
  );                                                              // end of return
}                                                                 // end of ProductList
export default memo(ProductList);                                 // memo + stable dispatch = no extra renders
```

`src/components/CartSummary.jsx`:

```jsx
import { useCart, useCartDispatch } from '../context/CartContext.jsx'; // cart data + dispatch
import { cartTotal } from '../context/cartReducer.js';                  // helper that adds up the total
import { useAuth } from '../context/AuthContext.jsx';                    // who is logged in

export default function CartSummary() {                           // shows the cart and the total
  const cart = useCart();                                         // re-renders whenever the cart changes (that's correct here)
  const dispatch = useCartDispatch();                             // to remove items
  const { user } = useAuth();                                     // to greet the user
  return (                                                        // what the summary shows
    <section>                                                     {/* cart box */}
      <h2>{user ? `${user.name}'s cart` : 'Your cart'}</h2>       {/* title uses the logged-in user */}
      {cart.items.map((i) => (                                    // one line per item
        <p key={i.id}>                                            {/* key = item id */}
          {i.name} × {i.qty}                                      {/* name and quantity */}
          <button onClick={() => dispatch({ type: 'remove', id: i.id })}>Remove</button> {/* remove this item */}
        </p>                                                      // end of line
      ))}                                                         {/* end of map */}
      <strong>Total: ₹{cartTotal(cart)}</strong>                  {/* price × qty, added up */}
    </section>                                                    // end of cart box
  );                                                              // end of return
}                                                                 // end of CartSummary
```

**Step 6: `src/App.jsx`**, where all three providers wrap the page:

```jsx
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx'; // theme provider + hook
import { AuthProvider } from './context/AuthContext.jsx';             // login provider
import { CartProvider } from './context/CartContext.jsx';             // cart provider
import Header from './components/Header.jsx';                         // top bar
import ProductList from './components/ProductList.jsx';               // products
import CartSummary from './components/CartSummary.jsx';               // cart

function Page() {                                                 // the page inside all providers
  const { theme } = useTheme();                                   // read the theme for colours
  const style = theme === 'dark' ? { background: '#111', color: '#eee' } : {}; // dark = dark background, light text
  return (                                                        // the page layout
    <main style={style}>                                          {/* whole page */}
      <Header />                                                  {/* theme + login buttons */}
      <ProductList />                                             {/* products with Add buttons */}
      <CartSummary />                                             {/* cart and total */}
    </main>                                                       // end of page
  );                                                              // end of return
}                                                                 // end of Page

export default function App() {                                   // the root component
  return (                                                        // providers wrap everything that needs them
    <ThemeProvider>                                               {/* 1. theme for the whole app */}
      <AuthProvider>                                              {/* 2. logged-in user */}
        <CartProvider>                                            {/* 3. cart state + dispatch */}
          <Page />                                                {/* the actual page */}
        </CartProvider>                                           {/* end of cart */}
      </AuthProvider>                                             {/* end of auth */}
    </ThemeProvider>                                              // end of theme
  );                                                              // end of return
}                                                                 // end of App
```

**What I saw when I ran it.** I built the app with Vite and rendered it in a test (React 19.3 + jsdom). I clicked "Add" twice on Notebook, then "Log in", then the theme button:

```text
ProductList renders: 1
cart: Hari's cart · Notebook × 2 · Total: ₹100
header: Theme: dark · Log out Hari
```

`ProductList` rendered **only once** during all of that. It reads only `dispatch`, which never changes, and it's wrapped in `memo`. Rendering `<Header />` with no providers around it throws `useTheme must be used inside <ThemeProvider>`, which is exactly the message we wrote.

**Why each design choice matters:**

| Choice | Without it | With it |
|---|---|---|
| Custom hook per context | `useContext(X)` everywhere, and a silent `null` if the Provider is missing | one import, plus a clear error |
| `useMemo` on the value | a new object on every provider render, so every reader re-renders | readers re-render only when the data really changes |
| `useCallback` on `login`/`logout` | new functions each render, so the memoised value breaks | stable functions |
| Data and dispatch in separate contexts | the button list re-renders on every cart change | the button list renders once |
| Three small contexts, not one big one | a theme change re-renders cart readers | each change only touches its own readers |
| Reducer in a plain `.js` file | logic is mixed into JSX and hard to test | testable in Node with no React |

:::version[Version note]
**React 19** lets you render `<ThemeContext value={…}>` directly. In React 18 and older, write `<ThemeContext.Provider value={…}>`; it still works in 19. React 19 also adds `use(ThemeContext)`. It reads context like `useContext`, but you may call it inside `if` statements.
:::

**Try it yourself.** Do these on your copy, then check the answers.

1. Make "Log out" also empty the cart.

:::answer
`AuthProvider` sits outside `CartProvider`, so it can't use the cart dispatch. Do it in `Header` instead: `const dispatch = useCartDispatch();` then `onClick={() => { dispatch({ type: 'clear' }); logout(); }}`. Another option is to move `CartProvider` outside `AuthProvider` and clear it inside `logout`.
:::

2. Add a "−" button that lowers the quantity by 1, and removes the item at 0.

:::answer
Add `case 'decrease':` to the reducer. If the item's qty is 1, return `items.filter(...)`. Otherwise `map` it to `{ ...i, qty: i.qty - 1 }`. Then dispatch `{ type: 'decrease', id: i.id }` from `CartSummary`.
:::

3. Remember the theme after a page refresh.

:::answer
Start state from storage: `useState(() => localStorage.getItem('theme') ?? 'light')`. Save on change: `useEffect(() => localStorage.setItem('theme', theme), [theme])`.
:::

4. Show the number of cart items in the `Header` (e.g. "🛒 3").

:::answer
In `Header`, call `const cart = useCart();` and show `cart.items.reduce((n, i) => n + i.qty, 0)`. Header will now re-render on cart changes, which is correct, because it shows cart data.
:::

## 🎯 Why do we use it?

- **To really learn Context by building, not just reading.** You use all the important parts once: provider, custom hook, `useMemo`, `useReducer`, and split contexts.
- **To avoid prop drilling.** `Header` and `CartSummary` get the user without `App` passing it through props.
- **To feel the performance trade-offs.** You can see in the console which components re-render, and why.
- **To have something real to talk about** when an interviewer asks about Context.

## ⚠️ Common mistakes

- **Forgetting the Provider.** Without the custom hook's check, `useContext` returns `null`, and you get a confusing "cannot read properties of null" later.
- **Passing a new object as the value on every render**, such as `value={{ user, login }}` with no `useMemo`. Every reader re-renders.
- **One giant "AppContext" with everything.** Any small change re-renders every reader. Split by topic.
- **Mutating state in the reducer**, such as `state.items.push(...)`. React won't see the change. Always return new objects.

## 🗣️ How to answer in an interview

> "To learn the Context API properly, I built a small app with three contexts: a theme switch, a fake login, and a cart.
>
> Each context has its own provider and its own custom hook, like useAuth. The hook throws a clear error if the provider is missing. I memoise the provider value with useMemo and useCallback, so readers only re-render when the data really changes.
>
> For the cart I used useReducer, with the reducer in a plain JavaScript file, so I could test it in Node. I also put the cart data and dispatch in two separate contexts. The product list only needs dispatch, so it rendered just once, even while I added items.
>
> I'd use this pattern for small, shared, rarely changing data like theme and the logged-in user. For big, frequently changing state across many screens, I'd use Redux Toolkit, like we do at work with Redux and redux-saga."

**Be honest about where you used it.** Your resume lists Context API, but you don't remember using it at work. Say you learned it by building this project, or by using it in a personal app: [FILL IN: where you have actually used Context — this practice project, a personal app, or work]. Don't claim work use you can't describe.

## 🔁 Follow-up questions

### Why not put everything in one context?

When any part of a context's value changes, every component that reads it re-renders. Separate contexts mean a theme change doesn't re-render cart readers, and a cart change doesn't re-render the header.

### When would you switch this app to Redux?

When the cart logic grows, for example syncing with an API, many screens editing it, or needing DevTools, middleware or time-travel debugging. See [how to choose](topic:redux-context/how-to-choose).

### Why does ProductList need memo if it reads only dispatch?

Context only skips re-renders caused by context changes. `ProductList` would still re-render whenever its parent `Page` re-renders, for example on a theme change. `memo` stops that, because it has no props that change.

### How would you test a component that uses useAuth?

Render it inside the real `AuthProvider` in the test, with React Testing Library, and click the buttons. Or write a small test wrapper with a fixed value. See [testing React components](topic:react/testing-rtl).

## ✅ Quick check

### 1. What does `useTheme()` do if there is no `<ThemeProvider>` above the component?

:::answer
It throws `useTheme must be used inside <ThemeProvider>`. `useContext` returns the default value, `null`, and our custom hook turns that into a clear error.
:::

### 2. The cart changes. Which components re-render: Header, ProductList or CartSummary?

:::answer
**CartSummary only.** It reads the cart data. ProductList reads only `dispatch`, which never changes, and Header doesn't read the cart at all.
:::

### 3. What's wrong with `value={{ theme, toggleTheme }}` written directly in the provider?

- A) Nothing
- B) A new object is made on every render, so every reader re-renders
- C) It's a syntax error

:::answer
**B.** Wrap it in `useMemo(() => ({ theme, toggleTheme }), [theme])`, so the object only changes when `theme` changes.
:::
