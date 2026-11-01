import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, X } from "lucide-react";
import { useAuth, homeFor } from "../auth/AuthContext.jsx";
import { api } from "../api/client.js";
import { Field, FormError, Spinner } from "./ui.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthPanel({ mode, onMode, onClose }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const first = useRef(null);

  const [role, setRole] = useState("patient");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [specs, setSpecs] = useState([]);
  const [f, setF] = useState({ name: "", email: "", password: "", specializationId: "", qualifications: "", experienceYears: "", licenseNumber: "" });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const isSignup = mode === "signup";

  useEffect(() => {
    api.get("/api/specializations").then((d) => setSpecs(d.specializations)).catch(() => {});
  }, []);

  useEffect(() => {
    setError("");
    first.current?.focus();
  }, [mode, role]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!EMAIL_RE.test(f.email)) return setError("Enter a valid email address.");
    if (f.password.length < (isSignup ? 8 : 1)) return setError(isSignup ? "Password must be at least 8 characters." : "Enter your password.");
    if (isSignup && !f.name.trim()) return setError("Enter your full name.");
    if (isSignup && role === "doctor" && !f.specializationId) return setError("Choose your specialization.");

    setBusy(true);
    try {
      if (isSignup) await register({ ...f, role });
      const user = await login(f.email, f.password);
      const from = location.state?.from;
      navigate(from && from.startsWith(`/${user.role}`) ? from : homeFor(user.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="absolute inset-0 z-30 grid place-items-center overflow-y-auto bg-[rgba(2,2,30,.55)] p-4 backdrop-blur-md animate-fade-in" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={isSignup ? "Create account" : "Log in"} className="glass relative my-auto w-full max-w-md animate-panel-in p-7 sm:p-8">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 text-lav-300 hover:bg-white/10" aria-label="Close">
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-2xl font-light tracking-tight text-lav-100">{isSignup ? "Create your account" : "Welcome back"}</h2>
        <p className="mb-6 mt-1 text-sm text-lav-400">{isSignup ? "Join as a patient or as a doctor." : "Log in to continue to your dashboard."}</p>

        {isSignup && (
          <div className="seg mb-5" role="tablist" aria-label="Account type">
            <span className="thumb" style={{ transform: role === "doctor" ? "translateX(100%)" : "none" }} />
            {["patient", "doctor"].map((r) => (
              <button key={r} type="button" role="tab" aria-selected={role === r} onClick={() => setRole(r)} className={role === r ? "text-ink-900" : "text-lav-200"}>
                I am a {r}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4" noValidate>
          {isSignup && (
            <Field label="Full name">
              <input ref={first} className="input" value={f.name} onChange={set("name")} autoComplete="name" placeholder={role === "doctor" ? "Dr. Full Name" : "Your name"} />
            </Field>
          )}
          <Field label="Email">
            <input ref={isSignup ? null : first} type="email" className="input" value={f.email} onChange={set("email")} autoComplete="email" placeholder="you@example.com" />
          </Field>
          <Field label="Password">
            <div className="relative">
              <input type={show ? "text" : "password"} className="input pr-10" value={f.password} onChange={set("password")} autoComplete={isSignup ? "new-password" : "current-password"} placeholder={isSignup ? "At least 8 characters" : "Your password"} />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-lav-400 hover:text-lav-100" aria-label={show ? "Hide password" : "Show password"}>
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          {isSignup && role === "doctor" && (
            <div className="animate-fade-up space-y-4">
              <Field label="Specialization">
                <select className="input" value={f.specializationId} onChange={set("specializationId")}>
                  <option value="">Select specialization</option>
                  {specs.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Qualifications" hint="Comma separated">
                  <input className="input" value={f.qualifications} onChange={set("qualifications")} placeholder="MBBS, MD" />
                </Field>
                <Field label="Experience (yrs)">
                  <input type="number" min="0" max="70" className="input" value={f.experienceYears} onChange={set("experienceYears")} />
                </Field>
              </div>
              <Field label="Medical licence no.">
                <input className="input" value={f.licenseNumber} onChange={set("licenseNumber")} />
              </Field>
            </div>
          )}

          <FormError>{error}</FormError>

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy && <Spinner />} {isSignup ? "Create account" : "Log in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-lav-400">
          {isSignup ? "Already have an account?" : "New to Dhanwantari?"}{" "}
          <button type="button" className="font-medium text-lav-100 underline-offset-4 hover:underline" onClick={() => onMode(isSignup ? "login" : "signup")}>
            {isSignup ? "Log in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}
