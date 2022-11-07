import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import SearchParams from "./SearchParams";
import Details from "./Details";

// Function component
// const App = () => {
// one way data flow
//   return React.createElement("div", {}, [
//     React.createElement("h1", {}, "Adopt Me!"),
//     React.createElement(Pet, {
//       name: "Luna",
//       animal: "Dog",
//       breed: "Havanese",
//     }),
//     React.createElement(Pet, {
//       name: "Pepper",
//       animal: "Bird",
//       breed: "Cockatiel",
//     }),
//     React.createElement(Pet, { name: "Doink", animal: "Cat", breed: "Mix" }),
//   ]);
// };

const App = () => {
  return (
    <BrowserRouter>
      <header>
        <Link to="/">Adopt Me!</Link>
      </header>
      <Routes>
        {/* pattern matching */}
        <Route exact path="/details/:id" element={<Details />} />
        <Route path="/" element={<SearchParams />} />
      </Routes>
    </BrowserRouter>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
