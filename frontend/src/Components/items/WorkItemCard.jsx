/* eslint-disable react/prop-types */

export const WorkItemCard = ({ item }) => {
  return (
    <div className="bg-[#0a0f1e] text-white p-4 rounded-xl border border-cyan-400 shadow-md flex flex-col items-start mb-4">
      <p className="font-bold">{item.work}</p>
      <p className="text-yellow-400">${item.amount}</p>
      <p className="text-gray-400">{item.time}</p>
    </div>
  );
};