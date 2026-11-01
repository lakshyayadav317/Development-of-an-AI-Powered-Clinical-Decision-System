import { useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, Moon, Sun, User, X } from "lucide-react";
import Brand from "./Brand.jsx";
import { useAuth, homeFor } from "../auth/AuthContext.jsx";
import { api } from "../api/client.js";
import { useTheme } from "../lib/theme.js";

const PATIENT_LINKS = [
  ["/patient", "Dashboard", true],
  ["/patient/predict", "Predict"],
  ["/patient/doctors", "Doctors"],
  ["/patient/sessions", "Sessions"],
  ["/patient/reports", "Reports"],
  ["/blogs", "Blogs"],
];
const DOCTOR_LINKS = [
  ["/doctor", "Dashboard", true],
  ["/doctor/appointments", "Appointments"],
  ["/doctor/calendar", "Calendar"],
  ["/doctor/patients", "Patients"],
  ["/doctor/analyze", "Analyze"],
  ["/blogs", "Blogs"],
];

const linkCls = ({ isActive }) =>
  `rounded-full px-3 py-1.5 text-sm transition ${isActive ? "bg-lav-100 text-ink-900" : "text-lav-200 hover:bg-white/10"}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [theme, toggleTheme] = useTheme();

  // lightweight polling keeps the bell fresh without websockets
  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    const load = () =>
      api
        .get("/api/notifications?unread=true")
        .then((d) => alive && setUnread(d.unread))
        .catch(() => {});
    load();
    const id = setInterval(load, 30000);
    const onRead = () => load();
    window.addEventListener("notifications:changed", onRead);
    return () => {
      alive = false;
      clearInterval(id);
      window.removeEventListener("notifications:changed", onRead);
    };
  }, [user]);

  const links = user?.role === "doctor" ? DOCTOR_LINKS : user ? PATIENT_LINKS : [["/blogs", "Blogs"]];

  const doLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-6">
      <nav className="glass mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full px-4 py-2.5">
        <Brand to={user ? homeFor(user.role) : "/"} />

        <div className="hidden items-center gap-1 md:flex">
          {links.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end} className={linkCls}>
              {label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="rounded-full p-2 text-lav-200 hover:bg-white/10" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          {user ? (
            <>
              <Link to="/notifications" className="relative rounded-full p-2 text-lav-200 hover:bg-white/10" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>
                )}
              </Link>
              <Link to={`/${user.role}/profile`} className="hidden items-center gap-2 rounded-full border border-white/10 py-1 pl-1 pr-3 text-sm text-lav-100 hover:bg-white/10 sm:flex">
                {/* IMAGE: user avatar - replace /public/images/avatar-placeholder.svg or pass a real avatarUrl */}
                <img src="/images/avatar-placeholder.svg" alt="" className="h-6 w-6 rounded-full object-cover" />
                <span className="max-w-[110px] truncate">{user.name}</span>
              </Link>
              <button onClick={doLogout} className="rounded-full p-2 text-lav-200 hover:bg-white/10" aria-label="Log out" title="Log out">
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            <Link to="/?auth=login" className="btn-primary btn-sm">
              <User className="h-3.5 w-3.5" /> Login
            </Link>
          )}
          <button className="rounded-full p-2 text-lav-200 hover:bg-white/10 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="glass mx-auto mt-2 flex max-w-6xl animate-fade-in flex-col gap-1 p-3 md:hidden">
          {links.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end} className={linkCls} onClick={() => setOpen(false)}>
              {label}
            </NavLink>
          ))}
          {user && (
            <NavLink to={`/${user.role}/profile`} className={linkCls} onClick={() => setOpen(false)}>
              My profile
            </NavLink>
          )}
        </div>
      )}
    </header>
  );
}
