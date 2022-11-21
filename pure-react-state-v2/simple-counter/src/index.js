import React, { Component } from 'react';
import { render } from "react-dom";

import Counter from './CounterComponent.js';
import CounterFunctin from './CounterFunctionComponent';

render(<>
  <Counter max={10} />
  <CounterFunctin max={10} />
</>, document.getElementById("root"));
