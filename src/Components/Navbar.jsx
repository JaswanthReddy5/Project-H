import React, { useState } from "react";
import { FaHome, FaChartBar, FaShoppingCart, FaUser, FaPlus, FaArrowLeft } from "react-icons/fa";

export const Navbar = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedOption, setSelectedOption] = useState("default"); // State for Default/Product toggle

  const handleClick = (index) => {
    setActiveIndex(index);
  };

  return (
    <div>
      {showForm ? (
        <div className="p-6 bg-black min-h-screen text-white">
          {/* Back Button */}
          <button
            onClick={() => setShowForm(false)}
            className="flex items-center text-cyan-400 mb-4"
          >
            <FaArrowLeft className="mr-2" /> Back
          </button>

          {/* Toggle Buttons */}
          <div className="flex justify-center items-center space-x-4 mb-6">
            <button
              onClick={() => setSelectedOption("default")}
              className={`px-4 py-2 rounded-lg ${
                selectedOption === "default" ? "bg-cyan-400 text-black" : "bg-gray-700 text-white"
              }`}
            >
              Default
            </button>
            <span className="text-cyan-400">|</span>
            <button
              onClick={() => setSelectedOption("product")}
              className={`px-4 py-2 rounded-lg ${
                selectedOption === "product" ? "bg-cyan-400 text-black" : "bg-gray-700 text-white"
              }`}
            >
              Product
            </button>
          </div>

          {/* Conditional Form Rendering */}
          {selectedOption === "default" ? (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Work to be Done"
                className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full"
              />
              <input
                type="text"
                placeholder="Amount"
                className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full"
              />
              <input
                type="text"
                placeholder="Within How much Time "
                className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Product Description"
                className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full"
              />
              <input
                type="text"
                placeholder="Price"
                className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full"
              />
              <input
                type="text"
                placeholder="Photos"
                className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full"
              />
              <input
                type="text"
                placeholder="Video"
                className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full"
              />
            </div>
          )}
        </div>
      ) : (
        // Navbar
        <div className="fixed bottom-0 left-0 w-full flex justify-around items-center bg-black py-4 rounded-t-2xl shadow-[0_-2.2rem_10px_rgba(0,255,255,0.5)]">
          {[
            { icon: FaHome },
            { icon: FaChartBar },
            { icon: FaPlus, isAdd: true }, // Add button
            { icon: FaShoppingCart },
            { icon: FaUser },
          ].map(({ icon: Icon, isAdd }, index) => (
            <div
              key={index}
              className={`relative p-2 group ${
                isAdd ? "bg-cyan-400 p-3 rounded-full text-black shadow-lg" : ""
              }`}
              onClick={() => (isAdd ? setShowForm(true) : handleClick(index))}
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
      )}
    </div>
  );
};
