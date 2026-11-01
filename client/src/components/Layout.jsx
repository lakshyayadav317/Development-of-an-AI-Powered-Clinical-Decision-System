import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import AppBackground from "./AppBackground.jsx";

export default function Layout() {
  return (
    <>
      <AppBackground />
      <Navbar />
      <main className="page">
        <Outlet />
      </main>
    </>
  );
}
