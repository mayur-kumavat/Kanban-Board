import { Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Boards from "./pages/Boards";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route
        path="/boards"
        element={
          <ProtectedRoute>
            <Boards />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}