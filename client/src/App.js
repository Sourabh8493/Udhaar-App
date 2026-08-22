import "./App.css";
import "./theme.css";
import Navbar from "./components/Navbar";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Records from "./components/Records";
import Groups from "./components/Groups";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import VerifyEmail from "./components/VerifyEmail";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import Info from "./components/Info";
import History from "./components/History";
import Alert from "./components/Alert";
import RecordState from "./context/RecordState";
import GroupState from "./context/GroupState";
import AlertState from "./context/AlertState";
import MembersState from "./context/MembersState";
import ThemeState from "./context/ThemeState";
import NotificationState from "./context/NotificationState";

function App() {
  return (
    <ThemeState>
      <MembersState>
        <AlertState>
          <GroupState>
            <RecordState>
              <NotificationState>
                <Router>
                  <Navbar />
                  <Alert />
                  <Routes>
                    <Route path="/" element={<Groups />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/info" element={<Info />} />
                    <Route path="/groups/:groupid" element={<Records />} />
                    <Route path="/groups/:groupid/history" element={<History />} />
                  </Routes>
                </Router>
              </NotificationState>
            </RecordState>
          </GroupState>
        </AlertState>
      </MembersState>
    </ThemeState>
  );
}

export default App;
