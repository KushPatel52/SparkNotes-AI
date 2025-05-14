import NavBar from "../components/NavBar";
import { useState } from "react";

export default function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <>
      <NavBar onAuthClick={() => {/* TODO: implement auth modal or redirect */}} />

      {/* hero‑style wrapper */}
      <section className="min-h-screen w-full bg-hero flex items-start pt-28 pb-40">
        <div className="max-w-7xl mx-auto w-full px-8">

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-10">
            Contact&nbsp;Us
          </h1>

          {/* optional blurb */}
          <p className="text-white/80 text-lg mb-16 max-w-2xl">
            Have questions or feedback? Drop us a line and we'll get back to you within 24 hours.
          </p>

          {/* Two‑column form card */}
          <div className="bg-white rounded-2xl shadow-xl p-10 grid lg:grid-cols-2 gap-12">

            {/* LEFT side – labels (empty for symmetry, you can add text later) */}
            <div className="hidden lg:block"></div>

            {/* RIGHT side – the form */}
            {!sent ? (
              <form
                className="flex flex-col gap-6"
                action="https://formspree.io/f/xjkwwbzb"   /* 1️⃣ replace with your Formspree endpoint */
                method="POST"
                onSubmit={() => setSent(true)}
              >
                <label>
                  <span className="block mb-1 font-medium">Name <span className="text-emerald-600">(required)</span></span>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full rounded-lg border border-gray-300 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>

                <label>
                  <span className="block mb-1 font-medium">Email <span className="text-emerald-600">(required)</span></span>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full rounded-lg border border-gray-300 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>

                <label>
                  <span className="block mb-1 font-medium">Subject</span>
                  <input
                    type="text"
                    name="subject"
                    className="w-full rounded-lg border border-gray-300 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>

                <label className="mb-2">
                  <span className="block mb-1 font-medium">Message <span className="text-emerald-600">(required)</span></span>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    className="w-full rounded-lg border border-gray-300 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </label>

                <button
                  type="submit"
                  className="self-end px-10 py-3 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
                >
                  Submit
                </button>
              </form>
            ) : (
              <p className="text-2xl font-semibold text-emerald-600">
                Thank you! Your message has been sent.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
