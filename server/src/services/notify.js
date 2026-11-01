import Notification from "../models/Notification.js";

/** Creates an in-app notification. Never throws - notifications must not break core flows. */
export async function notify(userId, { type = "general", title, message = "", link = "", appointment }) {
  try {
    return await Notification.create({ user: userId, type, title, message, link, appointment });
  } catch (err) {
    console.error("[notify] failed:", err.message);
    return null;
  }
}
