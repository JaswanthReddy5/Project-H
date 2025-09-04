/* eslint-disable react/prop-types */
import { FaHome, FaUtensils, FaShoppingCart, FaUser, FaPlus } from "react-icons/fa";

export const BottomNavigation = ({ activeIndex, onNavigate, onShowForm }) => {
  const navItems = [
    // Swap order: Food first, then Home
    { icon: FaUtensils, label: 'Food' },
    { icon: FaHome, label: 'Home' },
    { icon: FaPlus, label: 'Add', isAdd: true },
    { icon: FaShoppingCart, label: 'Products' },
    { icon: FaUser, label: 'Profile' }
  ];

  const handleClick = (index, isAdd) => {
    if (isAdd) {
      onShowForm();
    } else {
      onNavigate(index);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full flex justify-around items-center bg-black py-2 rounded-t-2xl shadow-[0_-1.1rem_10px_rgba(0,255,255,0.5)]">
      {navItems.map(({ icon: Icon, isAdd }, index) => (
        <div 
          key={index} 
          className={`relative p-2 group cursor-pointer ${
            isAdd ? "bg-cyan-400 p-3 rounded-full text-black shadow-lg" : ""
          }`} 
          onClick={() => handleClick(index, isAdd)}
        >
          <Icon 
            className={`${
              isAdd 
                ? "text-black text-3xl" 
                : "text-cyan-400 text-[1.65rem]"
            } transition-transform duration-300 ${
              activeIndex === index && !isAdd 
                ? "-translate-y-2 text-cyan-300" 
                : ""
            } group-hover:-translate-y-1 group-hover:text-cyan-300`} 
          />
        </div>
      ))}
    </div>
  );
};