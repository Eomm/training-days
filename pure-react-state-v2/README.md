# intermediate-react-v4

Course material for the course on Frontend Masters:

- [Source Code](https://github.com/FrontendMasters/react-state-management)
- [Source Code](https://github.com/stevekinney/grudges-react-state)
- [Source Code](https://github.com/stevekinney/star-wars-characters-react-state)
- [Web App](https://speakerdeck.com/stevekinney/react-state)
- [Course](https://frontendmasters.com/courses/pure-react-state/)



# Notes

Basically, Reactjs transforms your application state into DOM nodes.


## Different state types

- Model data state: the nouns in your application
- View/UI state: are those nouns sorted in ascending or descending?
- Session state: is the user logged in or not?
- Communication state: are we fetching the nouns from the server?
- Location state: what page are we on?

All these states can be grouped into two categories:

- Model state: data in your application
- Ephemeral state: everything else that will be wiped out when you hit refresh


## What should be in the state?

- Can I calculate it based on any other state or props in my component? If yes, it doesn't belong in the state - calculate it.
- Am I using it in render method? If yes, it belongs in the state, otherwise keep it as custom private fields.
- Remember to use `useReducer` when you have complex objects (such as array) and a lot of state that depends on each other (such loadings, errors and response).


## How setState works

```js
  increment() {
    this.setState({ count: this.state.count + 1 });
    this.setState({ count: this.state.count + 1 });
    this.setState({ count: this.state.count + 1 });
    // executes only once with the same vale (it doesn't show +3 but +1)

    // => Object.assign({}, 
    //   { count: this.state.count + 1 },
    //   { count: this.state.count + 1 })
  }

  increment() {
    this.setState((state) => { return { count: state.count + 1 } });
    this.setState((state) => { return { count: state.count + 1 } });
    this.setState((state) => { return { count: state.count + 1 } });
    // executes three times, incrementing the value (it shows +3)
  }
```


## Thunks

It is a function returned from another function.

```js
const useThunkReducer = (reducer, initialState) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const enhancedDispatch = useCallback(action => {
    if (typeof action === 'function') {
      console.log('It is a thunk');
      action(dispatch);
    } else {
      dispatch(action);
    }
  }, [dispatch]);
  return [state, enhancedDispatch];
};

// usage
const [state, dispatch] = useThunkReducer(reducer, initialState);
const { characters } = state;

useEffect(() => {
  dispatch((dispatch) => {
    // do something
  });
}, []);

// ℹ️ You can build an UNDO/REDO functionality with thunks
```