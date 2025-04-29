// src/App.js
import React from "react";
import Dashboard from "./dashboard"; // ✅ Make sure the filename and case match

function App() {
  return (
    <div className="App">
      <h1>Dashboard</h1>
      <Dashboard /> {/* ✅ Actually use the component */}
    </div>
  );
}

export default App;
