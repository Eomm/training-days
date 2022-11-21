import { Component } from 'react';

function getItemFromLocalStorage() {
  const item = localStorage.getItem('counterStorage');
  return item ? JSON.parse(item) : { count: 0 };
}

function callback() {
  console.log('After the state has been updated', this.state);
  localStorage.setItem('counterStorage', JSON.stringify(this.state));
  document.title = `Hello ${this.state.count}`;
}

class Counter extends Component {

  constructor(props) {
    super(props);
    this.state = getItemFromLocalStorage();

    this.increment = this.increment.bind(this);
    this.decrement = this.decrement.bind(this);
    this.reset = this.reset.bind(this);
  }

  increment() {
    // example 1
    // this.setState({ count: this.state.count + 1 });

    // example 2
    // this.setState((state) => { return { count: state.count + 1 } });

    // example 3: you can extract the function and test it
    this.setState((state, props) => {
      const { max } = props;
      if(state.count >= max) return;
      return { count: state.count + 1 }
    });
    
    // example 4
    this.setState((state, props) => {
      const { max } = props;
      if(state.count >= max) return;
      return { count: state.count + 1 }
    }, callback);
  }

  decrement() {
    this.setState({ count: this.state.count - 1 }, callback);
  }

  reset() {
    this.setState({ count: 0 }, callback);
  }

  render() {

    const { count } = this.state;

    return (
      <div className="Counter">
        <p className="count">{count}</p>
        <section className="controls">
          <button onClick={this.increment}>Increment</button>
          <button onClick={this.decrement}>Decrement</button>
          <button onClick={this.reset}>Reset</button>
        </section>
      </div>
    );
  }
}

export default Counter;
