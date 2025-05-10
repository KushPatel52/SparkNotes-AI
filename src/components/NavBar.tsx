console.log("NavBar v2 loaded");

import React, { useState } from "react";
import { FiMenu } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";

export default function NavBar({ onAuthClick }: { onAuthClick: () => void }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleSignOut = async () => {
    await auth.signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-black h-20 flex items-center">
      <div className="w-full flex items-center justify-between px-8">
        {/* Logo */}
        <a
          href="/"
          className="text-4xl font-extrabold tracking-widest text-white select-none"
          style={{ fontFamily: 'cursive' }}
        >
          SnapNotes AI
        </a>
        {/* Nav links and button group, right-aligned */}
        <div className="flex items-center gap-x-10">
          <Link to="/about" className="text-white text-lg font-normal hover:text-emerald-300 transition">About</Link>
          <Link to="/contact" className="text-white text-lg font-normal hover:text-emerald-300 transition">Contact Us</Link>
          {user ? (
            <button
              className="px-8 py-2 rounded-full bg-emerald-700 text-white text-lg font-bold border-2 border-white hover:bg-emerald-600 transition"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          ) : (
            <button
              className="px-8 py-2 rounded-full bg-indigo-900 text-white text-lg font-bold border-2 border-white hover:bg-indigo-800 transition"
              onClick={onAuthClick}
            >
              Sign in / Login
            </button>
          )}
        </div>
      </div>
      {/* Mobile burger */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden text-3xl text-emerald-700 ml-4"
      >
        <FiMenu />
      </button>
      {/* Mobile drop‑down */}
      {open && (
        <div className="md:hidden bg-lightPink/95 pb-4 space-y-2 shadow-lg absolute top-full left-0 w-full z-50">
          <Link to="/about"   className="block px-6 py-3 hover:bg-lightPink/70">About</Link>
          <Link to="/contact" className="block px-6 py-3 hover:bg-lightPink/70">Contact Us</Link>
          {user ? (
            <button className="mx-6 w-[calc(100%-3rem)] px-6 py-2 rounded-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white transition" onClick={handleSignOut}>
              Sign Out
            </button>
          ) : (
            <button className="mx-6 w-[calc(100%-3rem)] px-6 py-2 rounded-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white transition" onClick={onAuthClick}>
              Signin / Login
            </button>
          )}
        </div>
      )}
    </header>
  );
}
