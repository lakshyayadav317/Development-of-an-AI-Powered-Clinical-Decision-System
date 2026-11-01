import mongoose from "mongoose";

const doctorProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    specialization: { type: mongoose.Schema.Types.ObjectId, ref: "Specialization", required: true, index: true },
    qualifications: [String],
    experienceYears: { type: Number, min: 0, max: 70, default: 0 },
    licenseNumber: { type: String, trim: true, default: "" },
    clinicName: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    bio: { type: String, maxlength: 1200, default: "" },
    languages: [String],
    photoUrl: { type: String, default: "" },
    // MVP: doctors are listed immediately. Flip the default to false and add an admin
    // approval step before going to production.
    isVerified: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("DoctorProfile", doctorProfileSchema);
