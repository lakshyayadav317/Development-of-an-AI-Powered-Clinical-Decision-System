import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Briefcase, ChevronLeft, GraduationCap, Languages, MapPin } from "lucide-react";
import { api } from "../../api/client.js";
import { useApi } from "../../lib/useApi.js";
import { EmptyState, ErrorState, Field, FormError, PageLoader, Spinner } from "../../components/ui.jsx";
import { fmtDateShort, fmtTime } from "../../lib/format.js";

export default function DoctorDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const doc = useApi(`/api/doctors/${id}`);
  const avail = useApi(`/api/doctors/${id}/availability`);
  const preds = useApi("/api/predictions");
  const profile = useApi("/api/patient/profile");

  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [f, setF] = useState({ reason: "", symptoms: "", symptomDuration: "", severity: "mild", mode: "online", currentMedications: "", allergies: "", additionalNotes: "", predictionId: params.get("prediction") || "" });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  // prefill from the patient's health profile
  useEffect(() => {
    const p = profile.data?.profile;
    if (p) setF((s) => ({ ...s, currentMedications: s.currentMedications || (p.currentMedications || []).join(", "), allergies: s.allergies || (p.allergies || []).join(", ") }));
  }, [profile.data]);

  const days = avail.data?.availability || [];
  const slots = useMemo(() => days.find((d) => d.date === date)?.slots || [], [days, date]);
  useEffect(() => {
    if (!date && days.length) setDate(days[0].date);
  }, [days, date]);

  if (doc.loading || avail.loading) return <PageLoader />;
  if (doc.error) return <ErrorState message={doc.error} onRetry={doc.reload} />;
  const d = doc.data.doctor;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!date || !slot) return setError("Choose a date and a time slot.");
    if (!f.reason.trim()) return setError("Tell the doctor why you want a session.");
    setBusy(true);
    try {
      const { appointment } = await api.post("/api/appointments", { ...f, doctorProfileId: d._id, date, startTime: slot });
      navigate(`/patient/sessions/${appointment._id}`, { state: { justBooked: true } });
    } catch (err) {
      setError(err.message);
      if (err.status === 409) {
        setSlot("");
        avail.reload();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stagger">
      <Link to={-1} onClick={(e) => { e.preventDefault(); navigate(-1); }} className="mb-4 inline-flex items-center gap-1 text-sm text-lav-300 hover:text-white"><ChevronLeft className="h-4 w-4" /> Back to doctors</Link>

      <section className="glass flex flex-col gap-6 p-6 sm:flex-row">
        {/* IMAGE: doctor photo (doctorProfiles.photoUrl) */}
        <img src={d.photoUrl || "/images/doctor-placeholder.svg"} alt={`Dr. ${d.user.name}`} className="h-36 w-36 shrink-0 rounded-3xl bg-ink-900 object-cover" />
        <div>
          <h1 className="h1">{d.user.name}</h1>
          <p className="mt-1 text-brand-400">{d.specialization?.name}</p>
          <div className="muted mt-3 flex flex-wrap gap-x-5 gap-y-2">
            <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" /> {d.qualifications?.join(", ") || "-"}</span>
            <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {d.experienceYears} years experience</span>
            {d.clinicName && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {d.clinicName}{d.city ? `, ${d.city}` : ""}</span>}
            {d.languages?.length > 0 && <span className="flex items-center gap-1.5"><Languages className="h-4 w-4" /> {d.languages.join(", ")}</span>}
          </div>
          {d.bio && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-lav-200">{d.bio}</p>}
        </div>
      </section>

      <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="glass p-6 lg:col-span-2">
          <h2 className="h2 mb-4">1. Pick a time</h2>
          {!days.length ? (
            <EmptyState title="No open slots" hint="This doctor has not published availability yet. Check back soon." />
          ) : (
            <>
              <p className="label">Date</p>
              <div className="mb-5 flex flex-wrap gap-2">
                {days.map((x) => (
                  <button type="button" key={x.date} onClick={() => { setDate(x.date); setSlot(""); }} className={`chip ${date === x.date ? "chip-active" : ""}`}>{fmtDateShort(x.date)}</button>
                ))}
              </div>
              <p className="label">Time</p>
              <div className="grid grid-cols-3 gap-2">
                {slots.map((s) => (
                  <button type="button" key={s.startTime} onClick={() => setSlot(s.startTime)} aria-pressed={slot === s.startTime} className={`chip justify-center py-2 ${slot === s.startTime ? "chip-active" : ""}`}>{fmtTime(s.startTime)}</button>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="glass space-y-4 p-6 lg:col-span-3">
          <h2 className="h2">2. Session details</h2>
          <Field label="Reason for the session *"><textarea rows={2} maxLength={500} className="input" value={f.reason} onChange={set("reason")} placeholder="e.g. Follow-up on my X-ray result" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Symptoms" hint="Comma separated"><input className="input" value={f.symptoms} onChange={set("symptoms")} placeholder="cough, fever" /></Field>
            <Field label="Since when?"><input className="input" value={f.symptomDuration} onChange={set("symptomDuration")} placeholder="e.g. 5 days" /></Field>
            <Field label="Severity">
              <select className="input" value={f.severity} onChange={set("severity")}><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option></select>
            </Field>
            <Field label="Session type">
              <select className="input" value={f.mode} onChange={set("mode")}><option value="online">Online</option><option value="in_person">In person</option></select>
            </Field>
            <Field label="Current medicines"><input className="input" value={f.currentMedications} onChange={set("currentMedications")} /></Field>
            <Field label="Allergies"><input className="input" value={f.allergies} onChange={set("allergies")} /></Field>
          </div>
          <Field label="Share a prediction with the doctor" hint="The doctor will see the image, Grad-CAM and result.">
            <select className="input" value={f.predictionId} onChange={set("predictionId")}>
              <option value="">None</option>
              {preds.data?.predictions.map((p) => <option key={p._id} value={p._id}>{p.displayName} - {new Date(p.createdAt).toLocaleDateString()}</option>)}
            </select>
          </Field>
          <Field label="Anything else?"><textarea rows={2} maxLength={1000} className="input" value={f.additionalNotes} onChange={set("additionalNotes")} /></Field>

          <FormError>{error}</FormError>
          <button className="btn-primary" disabled={busy || !days.length}>
            {busy && <Spinner />} {date && slot ? `Request session - ${fmtDateShort(date)}, ${fmtTime(slot)}` : "Request session"}
          </button>
        </section>
      </form>
    </div>
  );
}
