// import { render } from "react-dom";
import { hydrate } from "react-dom";
import { BrowserRouter } from "react-router-dom";
import App from "./ServerApp";

hydrate(
  <BrowserRouter>
    <App />
  </BrowserRouter>, document.getElementById("root"));
