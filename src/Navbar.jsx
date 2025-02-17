import React from "react";
import { FaHome, FaChartBar, FaShoppingCart, FaUser } from "react-icons/fa";
import "./Navbar.css"; 

const Navbar = () => {
  return (
    <div className="navbar">
      <div className="nav-item">
        <FaHome className="icon" />
      </div>
      <div className="nav-item">
        <FaChartBar className="icon" />
      </div>
      <div className="nav-item">
        <FaShoppingCart className="icon" />
      </div>
      <div className="nav-item">
        <FaUser className="icon" />
      </div>
    </div>
  );
};

export default Navbar;
