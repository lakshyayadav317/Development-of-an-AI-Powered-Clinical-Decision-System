import DoctorProfile from "../models/DoctorProfile.js";
import DoctorAvailability from "../models/DoctorAvailability.js";
import Specialization from "../models/Specialization.js";
import { HttpError } from "../utils/HttpError.js";
import { todayStr, addDays, isPastSlot } from "../utils/dates.js";

export async function listSpecializations(_req, res) {
  const specializations = await Specialization.find().sort({ name: 1 });
  res.json({ specializations });
}

const freeSlots = (day) => day.slots.filter((s) => !s.isBooked && !isPastSlot(day.date, s.startTime));

/** GET /api/doctors?specialization=<slug>&q=<text> */
export async function listDoctors(req, res) {
  const { specialization: slug, q } = req.query;
  const filter = { isVerified: true };
  let specialization = null;

  if (slug) {
    specialization = await Specialization.findOne({ slug: String(slug).toLowerCase() });
    if (!specialization) return res.json({ doctors: [], specialization: null });
    filter.specialization = specialization._id;
  }

  let doctors = await DoctorProfile.find(filter)
    .populate("user", "name avatarUrl")
    .populate("specialization", "name slug")
    .limit(100)
    .lean();

  if (q) {
    const needle = String(q).toLowerCase();
    doctors = doctors.filter((d) => [d.user?.name, d.clinicName, d.city].some((v) => v?.toLowerCase().includes(needle)));
  }

  // next available slot per doctor
  const days = await DoctorAvailability.find({
    doctor: { $in: doctors.map((d) => d.user._id) },
    date: { $gte: todayStr() },
    slots: { $elemMatch: { isBooked: false } },
  })
    .sort({ date: 1 })
    .lean();

  const next = new Map();
  for (const day of days) {
    const key = String(day.doctor);
    if (next.has(key)) continue;
    const free = freeSlots(day);
    if (free.length) next.set(key, { date: day.date, startTime: free[0].startTime });
  }

  res.json({
    specialization,
    doctors: doctors.map((d) => ({ ...d, nextAvailable: next.get(String(d.user._id)) || null })),
  });
}

export async function getDoctor(req, res) {
  const doctor = await DoctorProfile.findById(req.params.id).populate("user", "name avatarUrl").populate("specialization", "name slug description");
  if (!doctor || !doctor.isVerified) throw new HttpError(404, "Doctor not found.");
  res.json({ doctor });
}

/** GET /api/doctors/:id/availability - only future, unbooked slots for the next 30 days. */
export async function getDoctorAvailability(req, res) {
  const doctor = await DoctorProfile.findById(req.params.id);
  if (!doctor) throw new HttpError(404, "Doctor not found.");
  const from = todayStr();
  const days = await DoctorAvailability.find({ doctor: doctor.user, date: { $gte: from, $lte: addDays(from, 30) } }).sort({ date: 1 }).lean();
  const availability = days
    .map((d) => ({ date: d.date, slots: freeSlots(d).map((s) => ({ startTime: s.startTime, endTime: s.endTime })) }))
    .filter((d) => d.slots.length);
  res.json({ availability });
}
