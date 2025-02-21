import React, { useState } from "react";
import { FaHome, FaChartBar, FaShoppingCart, FaUser, FaPlus } from "react-icons/fa";

export const Navbar = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const handleClick = (index) => {
    setActiveIndex(index);
  };

  return (
    <div className="fixed bottom-0 left-0 w-full flex justify-around items-center bg-black py-4 rounded-t-2xl shadow-[0_-2.2rem_10px_rgba(0,255,255,0.2)]">
      {[
        { icon: FaHome },
        { icon: FaChartBar },
        { icon: FaPlus, isAdd: true }, // Add button in the center
        { icon: FaShoppingCart },
        { icon: FaUser },
      ].map(({ icon: Icon, isAdd }, index) => (
        <div
          key={index}
          className={`relative p-2 group ${
            isAdd ? "bg-cyan-400 p-3 rounded-full text-black shadow-lg" : ""
          }`}
          onClick={() => handleClick(index)}
        >
          <Icon
            className={`${
              isAdd ? "text-black text-3xl" : "text-cyan-400 text-[1.65rem]"
            } transition-transform duration-300 ${
              activeIndex === index ? "-translate-y-2 text-cyan-300" : ""
            } group-hover:-translate-y-1 group-hover:text-cyan-300`}
          />
          {!isAdd && (
            <div
              className={`absolute left-1/2 bottom-0 w-12 h-1 bg-cyan-400 rounded opacity-0 transform -translate-x-1/2 transition-opacity duration-300 ${
                activeIndex === index ? "opacity-100" : "group-hover:opacity-100"
              }`}
            ></div>
          )}
        </div>
      ))}
    </div>
  );
};
