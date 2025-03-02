import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Submission from "./pages/Submission";

function App() {
  return (
    <Router>
      <Routes>
        {/* Authentication Routes */}
        <Route path="/" element={<Auth />} />
        <Route path="/dashboard/:Id" element={<Dashboard />} />
        <Route path='/submission/:Id/:challengeId' element={<Submission/>} />
      </Routes>
    </Router>
  );
}

export default App;
