// src/App.js
import React from "react";
import { BrowserRouter, Route, Routes, Link } from "react-router-dom";
import HeatMaps from "./pages/heatMaps";
import Graphs from "./pages/graphs";
import GPS from "./pages/gps";
import Dashboard from "./dashboard";
import './App.css'; // Ensure to import the CSS file

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <header>
          <h1>Dashboard</h1>
          <nav>
            <ul>
              <li><Link to="/heatmaps">Heat Maps</Link></li>
              <li><Link to="/graphs">Graphs</Link></li>
              <li><Link to="/gps">GPS</Link></li>
            </ul>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/heatmaps" element={<HeatMaps />} />
            <Route path="/graphs" element={<Graphs />} />
            <Route path="/gps" element={<GPS />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
