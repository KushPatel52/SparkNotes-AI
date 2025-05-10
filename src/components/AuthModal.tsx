import React, { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function AuthModal({ open, onClose, source }: { open: boolean; onClose: () => void; source: string }) {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "login") {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(userCred.user, { displayName: `${form.firstName} ${form.lastName}` });
      }
      setLoading(false);
      onClose();
      // Only redirect if modal was opened from landing page
      if (source === "/") {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 text-2xl">&times;</button>
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            className={`flex-1 py-2 font-bold rounded-lg ${tab === "login" ? "bg-cyan-100 text-cyan-700" : "bg-neutral-100 text-neutral-500"}`}
            onClick={() => setTab("login")}
          >
            Login
          </button>
          <button
            className={`flex-1 py-2 font-bold rounded-lg ${tab === "signup" ? "bg-cyan-100 text-cyan-700" : "bg-neutral-100 text-neutral-500"}`}
            onClick={() => setTab("signup")}
          >
            Signup
          </button>
        </div>
        {/* Error message */}
        {error && <div className="mb-4 text-red-600 text-center font-semibold">{error}</div>}
        {/* Form */}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {tab === "signup" && (
            <>
              <input
                type="text"
                placeholder="First Name"
                className="input input-bordered"
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                className="input input-bordered"
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                required
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            className="input input-bordered"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="input input-bordered"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
          />
          <button
            type="submit"
            className="mt-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-2 text-lg font-bold text-white shadow-md hover:from-teal-400 hover:to-cyan-400 transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Loading..." : tab === "login" ? "Login" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
