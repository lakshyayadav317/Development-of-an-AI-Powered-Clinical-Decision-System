import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import FlowBackground from "../components/FlowBackground.jsx";
import AuthPanel from "../components/AuthPanel.jsx";
import { useAuth, homeFor } from "../auth/AuthContext.jsx";
import { api } from "../api/client.js";

const LINE_1 = ["Precision", "Insight,"];
const LINE_2 = ["Personal", "Care"];

export default function Landing() {
  const { user } = useAuth();

  // The landing page always uses the dark look from the reference video; restore the user's theme on leave.
  useEffect(() => {
    const root = document.documentElement;
    const wasLight = root.classList.contains("light");
    root.classList.remove("light");
    return () => {
      if (wasLight) root.classList.add("light");
    };
  }, []);
  const [params, setParams] = useSearchParams();
  const mode = params.get("auth") === "signup" ? "signup" : params.get("auth") === "login" ? "login" : null;
  const openAuth = (m) => setParams({ auth: m }, { replace: true });
  const closeAuth = () => setParams({}, { replace: true });

  const [menu, setMenu] = useState(false);
  const [specs, setSpecs] = useState([]);
  const menuRef = useRef(null);

  useEffect(() => {
    api.get("/api/specializations").then((d) => setSpecs(d.specializations)).catch(() => {});
  }, []);

  useEffect(() => {
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenu(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const gate = (e) => {
    if (!user) {
      e.preventDefault();
      openAuth("login");
    }
  };

  let delay = 0.15;
  const word = (w) => (
    <span key={w} className="hero-word mr-[0.22em]" style={{ animationDelay: `${(delay += 0.12)}s` }}>
      {w}
    </span>
  );

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FlowBackground />

      <div className="frame">
        {/* ---- top bar ---- */}
        <header className="relative z-10 flex items-center justify-between gap-4 px-5 pt-5 sm:px-9 sm:pt-7">
          <Link to="/" className="flex items-center gap-2" aria-label="Dhanwantari">
            {/* IMAGE: brand logo - replace /public/images/logo.svg */}
            <img src="/images/logo.svg" alt="" className="h-8 w-8" />
            <span className="text-xl font-semibold tracking-tight text-lav-100">DHANWANTARI</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
            <Link to={user ? (user.role === "patient" ? "/patient/doctors" : "/doctor/patients") : "#"} onClick={gate} className="nav-link">
              Doctors
            </Link>
            <div className="relative" ref={menuRef}>
              <button className="nav-link flex items-center gap-1" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-haspopup="true">
                Specialities <ChevronDown className={`h-3.5 w-3.5 transition ${menu ? "rotate-180" : ""}`} />
              </button>
              {menu && (
                <ul className="glass absolute left-1/2 top-9 w-56 -translate-x-1/2 animate-panel-in p-2">
                  {specs.length === 0 && <li className="px-3 py-2 text-xs text-lav-400">Loading...</li>}
                  {specs.map((s) => (
                    <li key={s._id}>
                      <Link
                        to={user ? `/patient/doctors?specialization=${s.slug}` : "#"}
                        onClick={(e) => {
                          setMenu(false);
                          gate(e);
                        }}
                        className="block rounded-lg px-3 py-2 text-sm text-lav-200 hover:bg-white/10"
                      >
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Link to="/blogs" className="nav-link">
              Blogs
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <Link to={homeFor(user.role)} className="btn-primary btn-sm">
                Dashboard <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <button onClick={() => openAuth("signup")} className="btn-ghost btn-sm rounded-full">
                  Sign up
                </button>
                <button onClick={() => openAuth("login")} className="btn-primary btn-sm">
                  Login <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </header>

        {/* ---- hero ---- */}
        <main className="relative z-10 grid h-[calc(100%-5rem)] place-items-center px-6 text-center">
          <h1 className="hero-title -mt-6">
            <span className="block">{LINE_1.map(word)}</span>
            <span className="block">{LINE_2.map(word)}</span>
          </h1>
        </main>

        <p className="absolute inset-x-0 bottom-8 z-10 mx-auto w-fit animate-fade-up text-center text-sm leading-snug text-lav-200 sm:text-base" style={{ animationDelay: "1s" }}>
          Upload.
          <br />
          Understand.
          <br />
          Consult.
        </p>

        {mode && <AuthPanel mode={mode} onMode={openAuth} onClose={closeAuth} />}
      </div>
    </div>
  );
}
