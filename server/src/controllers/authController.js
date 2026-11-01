import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import PatientProfile from "../models/PatientProfile.js";
import DoctorProfile from "../models/DoctorProfile.js";
import Specialization from "../models/Specialization.js";
import { HttpError } from "../utils/HttpError.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const toList = (v) => (Array.isArray(v) ? v : String(v || "").split(",")).map((s) => String(s).trim()).filter(Boolean);

/** POST /api/register - creates the user + role-specific profile. Login itself is handled by Auth.js. */
export async function register(req, res) {
  const { name, email, password, role } = req.body || {};
  if (!name?.trim()) throw new HttpError(400, "Name is required.");
  if (!EMAIL_RE.test(email || "")) throw new HttpError(400, "A valid email is required.");
  if (typeof password !== "string" || password.length < 8) throw new HttpError(400, "Password must be at least 8 characters.");
  if (!["patient", "doctor"].includes(role)) throw new HttpError(400, "Role must be patient or doctor.");

  let specialization = null;
  if (role === "doctor") {
    const { specializationId } = req.body;
    if (!mongoose.isValidObjectId(specializationId)) throw new HttpError(400, "Please choose a specialization.");
    specialization = await Specialization.findById(specializationId);
    if (!specialization) throw new HttpError(400, "Unknown specialization.");
  }

  const normalized = email.toLowerCase().trim();
  if (await User.exists({ email: normalized })) throw new HttpError(409, "An account with this email already exists.");

  const user = await User.create({
    name: name.trim(),
    email: normalized,
    passwordHash: await bcrypt.hash(password, 10),
    role,
  });

  try {
    if (role === "patient") {
      await PatientProfile.create({ user: user._id });
    } else {
      const b = req.body;
      await DoctorProfile.create({
        user: user._id,
        specialization: specialization._id,
        qualifications: toList(b.qualifications),
        experienceYears: Number(b.experienceYears) || 0,
        licenseNumber: b.licenseNumber || "",
      });
    }
  } catch (err) {
    await User.deleteOne({ _id: user._id }); // keep user + profile consistent (no transactions on standalone MongoDB)
    throw err;
  }

  res.status(201).json({ message: "Account created. You can log in now." });
}

/** GET /api/me - current user + profile (used by the client after Auth.js login). */
export async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user || !user.isActive) throw new HttpError(401, "Account not found.");
  const profile =
    user.role === "patient"
      ? await PatientProfile.findOne({ user: user._id })
      : await DoctorProfile.findOne({ user: user._id }).populate("specialization", "name slug");
  res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, profile });
}
