import mongoose from "mongoose";
import User from "../models/User.js";
import PatientProfile from "../models/PatientProfile.js";
import DoctorProfile from "../models/DoctorProfile.js";
import Specialization from "../models/Specialization.js";
import { HttpError } from "../utils/HttpError.js";

const toList = (v) => (Array.isArray(v) ? v : String(v || "").split(",")).map((s) => String(s).trim()).filter(Boolean);
const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

export async function getPatientProfile(req, res) {
  const profile = await PatientProfile.findOne({ user: req.user.id });
  res.json({ profile });
}

export async function updatePatientProfile(req, res) {
  const b = req.body || {};
  const update = pick(b, ["dateOfBirth", "gender", "phone", "bloodGroup", "heightCm", "weightKg", "emergencyContact", "address"]);
  for (const k of ["allergies", "chronicConditions", "currentMedications"]) if (b[k] !== undefined) update[k] = toList(b[k]);
  if (update.dateOfBirth === "") update.dateOfBirth = null;
  for (const k of ["heightCm", "weightKg"]) if (update[k] === "") update[k] = null;

  const profile = await PatientProfile.findOneAndUpdate({ user: req.user.id }, { $set: update }, { new: true, upsert: true, runValidators: true });
  profile.profileCompleted = Boolean(profile.dateOfBirth && profile.gender && profile.phone);
  await profile.save();

  if (b.name?.trim()) await User.updateOne({ _id: req.user.id }, { name: b.name.trim() });
  res.json({ profile });
}

export async function getDoctorProfile(req, res) {
  const profile = await DoctorProfile.findOne({ user: req.user.id }).populate("specialization", "name slug");
  res.json({ profile });
}

export async function updateDoctorProfile(req, res) {
  const b = req.body || {};
  const update = pick(b, ["experienceYears", "licenseNumber", "clinicName", "city", "bio", "photoUrl"]);
  for (const k of ["qualifications", "languages"]) if (b[k] !== undefined) update[k] = toList(b[k]);
  if (b.specialization !== undefined) {
    if (!mongoose.isValidObjectId(b.specialization) || !(await Specialization.exists({ _id: b.specialization }))) {
      throw new HttpError(400, "Unknown specialization.");
    }
    update.specialization = b.specialization;
  }
  const profile = await DoctorProfile.findOneAndUpdate({ user: req.user.id }, { $set: update }, { new: true, runValidators: true }).populate("specialization", "name slug");
  if (!profile) throw new HttpError(404, "Doctor profile not found.");
  if (b.name?.trim()) await User.updateOne({ _id: req.user.id }, { name: b.name.trim() });
  res.json({ profile });
}
