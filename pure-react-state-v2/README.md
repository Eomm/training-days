# intermediate-react-v4

Course material for the course on Frontend Masters:

- [Source Code](https://github.com/FrontendMasters/react-state-management)
- [Web App]()
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