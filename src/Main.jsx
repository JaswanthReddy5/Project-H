import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Add from "./Add";

const Main = () => {
  return (
    <div style={{ height: "100vh", background: "#fff" }}>
      <Navbar />
      <Outlet /> {/* Allows child routes to render here */}
    </div>
  );
};

const routing = createBrowserRouter([
  {
    path: "/",
    element: <Main />,
    children: [
      {
        path: "Addbutton",
        element: <Add />,
      },
    ],
  },
]);

const root = createRoot(document.getElementById("root"));
root.render(<RouterProvider router={routing} />);
