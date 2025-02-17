import React from 'react'
import { createRoot } from 'react-dom/client'
import './Navbar.css'
import Navbar from './Navbar.jsx'

const Main = () => {
  return (
    <div  style={{ height: "100vh", background: "#fff" }}>
      <Navbar />
    </div>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<Main />);
