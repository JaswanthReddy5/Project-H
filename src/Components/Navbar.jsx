import React from "react";
import { FaHome, FaChartBar, FaShoppingCart, FaUser } from "react-icons/fa";

export const  Navbar = () => {
  return (
    <div className="fixed bottom-0 left-0 w-full flex justify-around items-center bg-black py-4 rounded-t-2xl shadow-[0_-2.2rem_10px_rgba(0,255,255,0.5)]">
      <div className="relative p-2 group">
        <FaHome className="text-cyan-400 text-[1.65rem] transition-transform duration-300 group-hover:-translate-y-1 group-hover:text-cyan-300" />
        <div className="absolute left-1/2 bottom-0 w-12 h-1 bg-cyan-400 rounded opacity-0 group-hover:opacity-100 transform -translate-x-1/2 transition-opacity duration-300"></div>
      </div>
      <div className="relative p-2 group">
        <FaChartBar className="text-cyan-400 text-[1.65rem] transition-transform duration-300 group-hover:-translate-y-1 group-hover:text-cyan-300" />
        <div className="absolute left-1/2 bottom-0 w-12 h-1 bg-cyan-400 rounded opacity-0 group-hover:opacity-100 transform -translate-x-1/2 transition-opacity duration-300"></div>
      </div>
      <div className="relative p-2 group">
        <FaShoppingCart className="text-cyan-400 text-[1.65rem] transition-transform duration-300 group-hover:-translate-y-1 group-hover:text-cyan-300" />
        <div className="absolute left-1/2 bottom-0 w-12 h-1 bg-cyan-400 rounded opacity-0 group-hover:opacity-100 transform -translate-x-1/2 transition-opacity duration-300"></div>
      </div>
      <div className="relative p-2 group">
        <FaUser className="text-cyan-400 text-[1.65rem] transition-transform duration-300 group-hover:-translate-y-1 group-hover:text-cyan-300" />
        <div className="absolute left-1/2 bottom-0 w-12 h-1 bg-cyan-400 rounded opacity-0 group-hover:opacity-100 transform -translate-x-1/2 transition-opacity duration-300"></div>
      </div>
    </div>
  );
};


