import { useState, useEffect } from 'react';

function getItemFromLocalStorage() {
  const item = localStorage.getItem('counterStorage');
  return item ? JSON.parse(item).count : 0;
}

function callback(count) {
  console.log('After the state has been updated');
  localStorage.setItem('counterStorage', JSON.stringify({ count }));
  document.title = `Hello ${count}`;
}

const Counter = (props) => {

  const { max } = props;
  const [count, setCount] = useState(getItemFromLocalStorage());

  const increment = () => {
    // example 1
    // setCount(count + 1);
    
    // example 2
    // setCount(c => c + 1);

    // example 3
    setCount(c => {
      // ⚠️ we don't have access to props here
      // const { max } = props;

      // ⚠️ we must return a value
      // if(state.count >= max) return;
      
      // ⚠️ we must use useEffect to introduce side effects
      if(c >= max) return c;
      return c + 1;
    });
  }

  // run every single render if we don't provide any arguments
  useEffect(() => {
    callback(count);
  }, [count]);

  const decrement = () => { setCount(count - 1); }
  const reset = () => { setCount(0); }

  return (
    <div className="Counter">
      <h1>Counter</h1>
      <p>{count}</p>
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

export default Counter;
