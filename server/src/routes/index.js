import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { uploadScan, uploadReport } from "../middleware/upload.js";
import { asyncHandler as h } from "../utils/HttpError.js";

import * as auth from "../controllers/authController.js";
import * as profile from "../controllers/profileController.js";
import * as doctors from "../controllers/doctorController.js";
import * as availability from "../controllers/availabilityController.js";
import * as predictions from "../controllers/predictionController.js";
import * as appointments from "../controllers/appointmentController.js";
import * as reports from "../controllers/reportController.js";
import * as notifications from "../controllers/notificationController.js";
import * as blogs from "../controllers/blogController.js";
import * as stats from "../controllers/statsController.js";

const router = Router();
const patientOnly = requireRole("patient");
const doctorOnly = requireRole("doctor");

router.get("/health", (_req, res) => res.json({ status: "ok" }));

// ---- public ----
router.post("/register", h(auth.register));
router.get("/specializations", h(doctors.listSpecializations)); // needed by the doctor sign-up form
router.get("/blogs", h(blogs.listBlogs));
router.get("/blogs/:slug", h(blogs.getBlog));

// ---- everything below needs an Auth.js session ----
router.use(requireAuth);

router.get("/me", h(auth.me));
router.get("/stats", h(stats.getStats));

// profiles
router.get("/patient/profile", patientOnly, h(profile.getPatientProfile));
router.put("/patient/profile", patientOnly, h(profile.updatePatientProfile));
router.get("/doctor/profile", doctorOnly, h(profile.getDoctorProfile));
router.put("/doctor/profile", doctorOnly, h(profile.updateDoctorProfile));

// doctors directory
router.get("/doctors", h(doctors.listDoctors));
router.get("/doctors/:id", h(doctors.getDoctor));
router.get("/doctors/:id/availability", h(doctors.getDoctorAvailability));

// doctor calendar
router.get("/availability/me", doctorOnly, h(availability.myAvailability));
router.put("/availability/:date", doctorOnly, h(availability.setDay));
router.delete("/availability/:date", doctorOnly, h(availability.clearDay));

// ML predictions (doctors may also analyse images)
router.post("/predictions", uploadScan.single("image"), h(predictions.createPrediction));
router.get("/predictions", h(predictions.listMyPredictions));
router.get("/predictions/:id", h(predictions.getPrediction));

// appointments / sessions
router.post("/appointments", patientOnly, h(appointments.createAppointment));
router.get("/appointments", h(appointments.listAppointments));
router.get("/appointments/:id", h(appointments.getAppointment));
router.patch("/appointments/:id/status", h(appointments.updateStatus));
router.patch("/appointments/:id/triage", doctorOnly, h(appointments.updateTriage));
router.put("/appointments/:id/report", doctorOnly, uploadReport.single("handwritten"), h(reports.saveReport));

// reports
router.get("/reports", h(reports.listReports));

// notifications
router.get("/notifications", h(notifications.listNotifications));
router.patch("/notifications/read-all", h(notifications.markAllRead));
router.patch("/notifications/:id/read", h(notifications.markRead));

export default router;
