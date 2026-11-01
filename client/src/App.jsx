import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import Landing from "./pages/Landing.jsx";
import Blogs from "./pages/Blogs.jsx";
import BlogDetail from "./pages/BlogDetail.jsx";
import Notifications from "./pages/Notifications.jsx";
import Predict from "./pages/Predict.jsx";

import PatientDashboard from "./pages/patient/Dashboard.jsx";
import PatientProfile from "./pages/patient/Profile.jsx";
import PredictionDetail from "./pages/patient/PredictionDetail.jsx";
import Doctors from "./pages/patient/Doctors.jsx";
import DoctorDetail from "./pages/patient/DoctorDetail.jsx";
import Sessions from "./pages/patient/Sessions.jsx";
import SessionDetail from "./pages/patient/SessionDetail.jsx";
import Reports from "./pages/patient/Reports.jsx";

import DoctorDashboard from "./pages/doctor/Dashboard.jsx";
import Appointments from "./pages/doctor/Appointments.jsx";
import Analysis from "./pages/doctor/Analysis.jsx";
import Calendar from "./pages/doctor/Calendar.jsx";
import DoctorProfile from "./pages/doctor/Profile.jsx";

const P = ({ children }) => <ProtectedRoute role="patient">{children}</ProtectedRoute>;
const D = ({ children }) => <ProtectedRoute role="doctor">{children}</ProtectedRoute>;

export default function App() {
  return (
    <Routes>
      {/* first page: hero + Auth.js login / sign-up */}
      <Route path="/" element={<Landing />} />

      <Route element={<Layout />}>
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blogs/:slug" element={<BlogDetail />} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

        <Route path="/patient" element={<P><PatientDashboard /></P>} />
        <Route path="/patient/profile" element={<P><PatientProfile /></P>} />
        <Route path="/patient/predict" element={<P><Predict /></P>} />
        <Route path="/patient/predictions/:id" element={<P><PredictionDetail /></P>} />
        <Route path="/patient/doctors" element={<P><Doctors /></P>} />
        <Route path="/patient/doctors/:id" element={<P><DoctorDetail /></P>} />
        <Route path="/patient/sessions" element={<P><Sessions /></P>} />
        <Route path="/patient/sessions/:id" element={<P><SessionDetail /></P>} />
        <Route path="/patient/reports" element={<P><Reports /></P>} />

        <Route path="/doctor" element={<D><DoctorDashboard /></D>} />
        <Route path="/doctor/appointments" element={<D><Appointments /></D>} />
        <Route path="/doctor/appointments/:id" element={<D><Analysis /></D>} />
        <Route path="/doctor/patients" element={<D><Appointments mode="patients" /></D>} />
        <Route path="/doctor/calendar" element={<D><Calendar /></D>} />
        <Route path="/doctor/analyze" element={<D><Predict /></D>} />
        <Route path="/doctor/profile" element={<D><DoctorProfile /></D>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
