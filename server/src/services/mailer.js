import nodemailer from "nodemailer";
import fs from "node:fs";
import { env } from "../config/env.js";
import { absolutePath } from "./storage.js";

let transporter = null;
const isConfigured = () => Boolean(env.smtp.host && env.smtp.user);

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const wrap = (inner) => `
  <div style="font-family:Arial,sans-serif;max-width:560px;line-height:1.5">
    ${inner}
    <p style="color:#666;font-size:12px;margin-top:24px">For your privacy this e-mail contains no medical details. Log in to the app to view them.</p>
  </div>`;

async function send(message) {
  if (!isConfigured()) {
    console.log("[mail] SMTP not configured - skipping e-mail");
    return "skipped";
  }
  try {
    await getTransporter().sendMail({ from: env.smtp.from, ...message });
    return "sent";
  } catch (err) {
    console.error("[mail] failed:", err.message);
    return "failed";
  }
}

/**
 * "Your report is ready" notice. Deliberately contains NO diagnosis, treatment or prescription -
 * only who/when and a link. Returns "sent" | "skipped" | "failed". Never blocks the report flow.
 */
export async function sendReportEmail({ to, patientName, doctorName, report, appointment }) {
  const link = `${env.clientUrl}/patient/sessions/${appointment._id}`;
  const attachments = [];
  if (env.mailAttachReport) {
    const file = absolutePath(report.handwrittenReportUrl);
    if (file && fs.existsSync(file)) attachments.push({ filename: report.handwrittenReportName || "handwritten-report", path: file });
  }
  return send({
    to,
    subject: "Your medical report is ready",
    html: wrap(`
      <h2>Hello ${esc(patientName)},</h2>
      <p>Dr. ${esc(doctorName)} has published a report for your session on ${esc(appointment.date)} at ${esc(appointment.startTime)}.</p>
      <p><a href="${link}">Log in to view your report</a></p>`),
    attachments,
  });
}

/** Session confirmed notice: doctor, date, time and mode only - no reason, symptoms or other details. */
export async function sendSessionConfirmedEmail({ to, patientName, doctorName, appointment }) {
  const link = `${env.clientUrl}/patient/sessions/${appointment._id}`;
  return send({
    to,
    subject: "Your session is confirmed",
    html: wrap(`
      <h2>Hello ${esc(patientName)},</h2>
      <p>Dr. ${esc(doctorName)} has confirmed your session.</p>
      <p><b>Date:</b> ${esc(appointment.date)}<br/><b>Time:</b> ${esc(appointment.startTime)} - ${esc(appointment.endTime)}<br/><b>Type:</b> ${appointment.mode === "online" ? "Online" : "In person"}</p>
      <p><a href="${link}">View your session</a></p>`),
  });
}
