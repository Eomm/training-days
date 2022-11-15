# intermediate-react-v4

Course material for the course on Frontend Masters:

- [Source Code](https://github.com/btholt/citr-v7-project/tree/main/12-portals-and-refs)
- [Web App](https://btholt.github.io/complete-intro-to-react-v7/lessons/intermediate-react-v4/welcome-to-intermediate-react-v4)
- [Course](https://frontendmasters.com/courses/intermediate-react-v4/)



# Notes

## Hooks chapter

[Hook Playground](https://codesandbox.io/s/github/btholt/react-hooks-examples-v4/tree/main/)

### `useState`

- Provide to `useState` a function that returns the initial state. This is useful when the initial state is expensive to compute
- Prefer plain values for performance reasons

### `useEffect`

The point of `useEffect` is to contain side effects.

- `useEffect(() => {})`: run when whatever changes the component
- `useEffect(() => {}, [])`: run once 
- `useEffect(() => {}, [time])`: run only when time changes

### `createContext`

Due the one way data flow in React, we need to pass data from parent to child.  
This is not always ideal. `createContext` allows us to pass data from parent to child without passing it down explicitly.

- Store only the data that impacts the entire application
- Don't store data that is only used in a single component

### `useRef`

Returns a mutable freezed object whose `.current` property is initialized to the passed argument (initialValue).  
The returned object will persist for the full lifetime of the component.

```js
const myH1 = useRef();
console.log(myH1.current); // gets always the H1 element, otherwise it would be always destroyed and recreated

<h1 ref={(el) => myH1.current = el}></h1>
```

### `useReducer`

It is like a `useState` but more powerful.

- It must return a new object state. If you return the same object, React will not re-render the component
- It makes `useState` more testable
- It is useful when you have a lot of state that depends on each other

```js
import { useReducer } from "react";

const reducer = (state, action) => {
  // switch on action
  return Object.assign({}, state, { ... });
};

const [currentState, dispatch] = useReducer(reducer, initialState);

<button onClick={() => dispatch({ type: "foo-bar" })}>➕</button>
```

### `useMemo`

- Performance optimization hook
- `useMemo`: memoize a value that is expensive to compute (e.g. fibonacci)
- don't use `useMemo` before you have a performance problem 😄


### `useCallback`

- Performance optimization hook
- Use it in conjunction to `memo` to avoid re-rendering of child components
- `useCallback` memoizes the function so that it is not recreated every time the parent component is re-rendered
- When a function is passed to a child component, it is recreated every time the parent component is re-rendered


### `useLayoutEffect`

- `useEffect` could be "in the future", while `useLayoutEffect` is garantied to run synchronously
- Measurements and Animations are the most common use cases
- It is like the `componentDidMount` lifecycle method

### `useImperativeHandle`

- It is used to build React libraries
- Don't use it in your application
- If you are using `forwardRef`, you can use `useImperativeHandle` to expose a custom API to the parent component.

### `useDebugValue`

- It is used to debug custom hooks
- Do you need to provide to your users a way to debug your custom hooks? Use `useDebugValue`
- It is like `console.log` but for React Chrome extension
