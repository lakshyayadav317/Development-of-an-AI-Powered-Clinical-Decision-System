# Dhanwantari - patient-doctor healthcare app (MERN + ML)

Patient: login -> upload scan -> ML prediction + risk -> doctors of the matching specialization -> book session -> report.
Doctor: calendar/availability -> accept requests -> see image + prediction + Grad-CAM -> priority & diagnosis status -> report (+ handwritten upload) -> emailed + shown in app.

```
dhanwantari/
  client/            React (Vite) + Tailwind, landing/auth page from your reference video
  server/            Express + Mongoose + Auth.js (@auth/express)
  ml_service_patch/  2 files to drop into your FastAPI project (adds prediction + Grad-CAM)
```

## 1. Run it

Prerequisites: Node 20+, MongoDB running locally (or an Atlas URI), Python env of your ML project.

```bash
npm run setup                          # installs server + client
cp server/.env.example server/.env     # then set AUTH_SECRET  (openssl rand -base64 32)
npm run seed                           # specializations, blogs, 9 demo doctors + availability, demo patient
npm run server                         # API on :5000      (terminal 1)
npm run client                         # app on :5173      (terminal 2)
```

Demo logins (from the seed): `patient@demo.com / Patient@123`, doctors e.g. `rohan.iyer@demo.com / Doctor@123`
(all doctor emails are in `server/src/seed/data.js`). `npm run seed -- --reset` wipes the DB first.

No ML service yet? Set `ML_MOCK=true` in `server/.env` and the app returns a fake prediction so you can test the whole flow.

## 2. Connect your ML service (required for real predictions)

Your current FastAPI app returns label/confidence/probabilities but **no Grad-CAM** (that only exists in `evaluation/evaluate_and_visualize.py`).
Copy these into your ML project (they only add code; `/predict/*` is untouched):

- `ml_service_patch/inference/explain.py` -> `<ml project>/inference/explain.py`
- `ml_service_patch/main.py` -> replaces `<ml project>/main.py` (adds `/analyze/{mri|skin|chest_xray}` returning the prediction plus `gradcam_base64`)

Then `uvicorn main:app --port 8000` and keep `ML_API_URL=http://127.0.0.1:8000`.
The user picks the scan type (MRI / skin / chest X-ray) in the UI, because your router cannot auto-detect it.

**Risk level is computed in the Node backend** (`server/src/config/diseaseMap.js`): each label has a base severity and a specialization; risk steps down one level when confidence < 0.5. It is decision support for choosing a doctor, not a clinical score - edit the map freely.

## 3. Auth.js

`@auth/express` is mounted at `/auth/*` (Credentials provider, JWT in an httpOnly cookie). The role (`patient|doctor`) is read from MongoDB in `authorize()` and copied into the token/session (`server/src/config/auth.js`). `requireAuth` / `requireRole` guard the API; `ProtectedRoute` guards the React routes. The client talks to Auth.js with plain fetch (`client/src/api/authClient.js`). Sign-up is a separate `POST /api/register`.
The Vite dev proxy forwards `/api`, `/auth`, `/uploads` to :5000 so cookies stay same-origin. In production run `npm run build` and set `NODE_ENV=production` + `AUTH_URL`; Express then serves `client/dist`.

## 4. Database (Mongoose, 10 collections as in the plan)

| Collection | Key fields |
| --- | --- |
| users | name, email (unique), passwordHash, role, isActive |
| patientProfiles | user, dateOfBirth, gender, phone, bloodGroup, height/weight, allergies[], chronicConditions[], currentMedications[], emergencyContact, address |
| doctorProfiles | user, specialization, qualifications[], experienceYears, licenseNumber, clinicName, city, bio, languages[], photoUrl, isVerified |
| specializations | name, slug, description |
| predictions | patient, modality, imageUrl, predictedLabel, displayName, confidence, probabilities, riskLevel, specialization, gradcamUrl |
| appointments | patient, doctor, doctorProfile, prediction, date, startTime, endTime, session-request form fields, status, priority, diagnosisStatus, slotLocked |
| doctorAvailability | doctor, date, slots[{startTime,endTime,isBooked,appointment}] |
| medicalReports | appointment (unique), patient, doctor, diagnosis, observations, treatment, prescription[], handwrittenReportUrl, status, emailStatus |
| notifications | user, type, title, message, link, isRead |
| blogs | title, slug, category, summary, overview, symptoms[], precautions[], treatments[], whenToSeeDoctor[] |

History uses these same collections (no extra history collections). Double booking is prevented twice: an atomic `isBooked false -> true` claim on the slot, plus a partial unique index on `appointments`.

## 5. Images

Every image is a plain `<img>`. Placeholders live in `client/public/images/` (see the README there for which component uses which file). Uploaded scans, Grad-CAM, reports are saved under `server/uploads/` and only the URL is stored in MongoDB; swap `server/src/services/storage.js` for S3/Cloudinary when you deploy.

## 6. Email

Set `SMTP_*` in `server/.env` to enable e-mails; if unset they are skipped and everything still works. Two mails are sent to the patient, and **neither contains medical details** (no reason, symptoms, diagnosis, treatment or prescription):

- **Session confirmed** (when the doctor accepts): doctor name, date, time, online/in-person, and a link.
- **Report ready** (when the doctor publishes): doctor name, session date/time, and a link to log in. The handwritten file is *not* attached; set `MAIL_ATTACH_REPORT=true` if you want it attached.

## Theme

The moon/sun button in the top bar switches between dark and light and remembers the choice. The landing/login page always stays dark to match the reference video.

## 7. What was and was not tested

Tested here: server and client build/syntax; the full Auth.js login/session/role-guard flow (real server, stubbed DB); the landing page and login in a real browser.
**Not tested (no MongoDB or PyTorch in my sandbox):** controllers against a real database (booking, availability, reports, notifications), the seed script, and the Grad-CAM patch. Run the seed and click through the flow once; report any error text and it can be fixed quickly.

## 8. Known MVP limits

- Anyone can sign up as a doctor and is listed immediately (`isVerified` defaults to true). Add admin approval before real use.
- `/uploads` URLs are unguessable but public; use signed URLs for real patient data.
- Dates/times are clinic-local strings; the server's timezone decides "past".
- Auth.js JWT sessions: deactivating a user takes effect when the session expires (7 days) for API reads that skip the DB.
- Medical content in the seed blogs is general information; have a clinician review it before publishing.
