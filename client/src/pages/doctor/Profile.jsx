import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { useApi } from "../../lib/useApi.js";
import { Field, FormError, FormNotice, PageHeader, PageLoader, Spinner } from "../../components/ui.jsx";

export default function DoctorProfile() {
  const { user, refresh } = useAuth();
  const specs = useApi("/api/specializations");
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get("/api/doctor/profile").then(({ profile: p }) => setF({
      name: user.name, specialization: p.specialization?._id || "", qualifications: (p.qualifications || []).join(", "), experienceYears: p.experienceYears ?? 0,
      licenseNumber: p.licenseNumber || "", clinicName: p.clinicName || "", city: p.city || "", languages: (p.languages || []).join(", "), bio: p.bio || "", photoUrl: p.photoUrl || "",
    })).catch((e) => setError(e.message));
  }, [user.name]);

  if (!f || specs.loading) return error ? <FormError>{error}</FormError> : <PageLoader />;
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError(""); setSaved(false);
    try { await api.put("/api/doctor/profile", f); await refresh(); setSaved(true); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="stagger space-y-6">
      <PageHeader title="My profile" subtitle="This is what patients see when they browse doctors." />
      <section className="glass grid gap-4 p-6 sm:grid-cols-2">
        <div className="flex items-center gap-4 sm:col-span-2">
          {/* IMAGE: doctor photo preview - set a photo URL below or replace the placeholder */}
          <img src={f.photoUrl || "/images/doctor-placeholder.svg"} alt="" className="h-20 w-20 rounded-2xl bg-ink-900 object-cover" />
          <div className="flex-1"><Field label="Photo URL" hint="Paste an image link (file upload can be added later)"><input className="input" value={f.photoUrl} onChange={set("photoUrl")} placeholder="https://..." /></Field></div>
        </div>
        <Field label="Full name"><input className="input" value={f.name} onChange={set("name")} /></Field>
        <Field label="Specialization">
          <select className="input" value={f.specialization} onChange={set("specialization")}>{specs.data?.specializations.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</select>
        </Field>
        <Field label="Qualifications" hint="Comma separated"><input className="input" value={f.qualifications} onChange={set("qualifications")} /></Field>
        <Field label="Experience (years)"><input type="number" min="0" max="70" className="input" value={f.experienceYears} onChange={set("experienceYears")} /></Field>
        <Field label="Licence number"><input className="input" value={f.licenseNumber} onChange={set("licenseNumber")} /></Field>
        <Field label="Languages" hint="Comma separated"><input className="input" value={f.languages} onChange={set("languages")} /></Field>
        <Field label="Clinic / hospital"><input className="input" value={f.clinicName} onChange={set("clinicName")} /></Field>
        <Field label="City"><input className="input" value={f.city} onChange={set("city")} /></Field>
        <div className="sm:col-span-2"><Field label="About you"><textarea rows={4} maxLength={1200} className="input" value={f.bio} onChange={set("bio")} /></Field></div>
      </section>
      <FormError>{error}</FormError>{saved && <FormNotice>Profile saved.</FormNotice>}
      <button className="btn-primary" disabled={busy}>{busy && <Spinner />} Save profile</button>
    </form>
  );
}
