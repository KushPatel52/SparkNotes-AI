import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Landing from "./pages/Landing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import LocalVideoProcessor from "./pages/LocalVideoProcessor";
import AuthModal from "./components/AuthModal";

function AppRoutes() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authSource, setAuthSource] = useState("/");
  const location = useLocation();

  const handleAuthClick = () => {
    setAuthSource(location.pathname);
    setAuthOpen(true);
  };

  return (
    <>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} source={authSource} />
      <Routes>
        <Route path="/" element={<Landing onAuthClick={handleAuthClick} />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/local-video-processor" element={<LocalVideoProcessor onAuthClick={handleAuthClick} />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}