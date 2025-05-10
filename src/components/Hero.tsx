import heroImg from "../assets/notes.jpg";

export default function Hero({ onAuthClick }: { onAuthClick?: () => void }) {
  return (
    <section className="w-full min-h-[calc(100vh-88px)] bg-blue-900 text-white flex items-center justify-center">
      <div className="max-w-5xl w-full flex flex-col md:flex-row items-center md:items-center px-4 sm:px-8 md:px-16 gap-8 md:gap-16 xl:gap-32 py-16 md:py-24">
        {/* Left – copy */}
        <div className="flex-1 flex flex-col justify-center items-start md:mr-0 space-y-6 md:space-y-10">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-tight text-left">
            Transform&nbsp;your<br />
            <span className="text-emerald-300">Note‑taking</span>
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl max-w-lg text-white/90">
            SnapNotes AI captures whiteboards &amp; lecture slides, flattens them,
            extracts text, and instantly turns everything into searchable
            Markdown &amp; high‑res images — all inside your browser.
          </p>
          <button
            type="button"
            className="inline-block self-start px-10 py-4 rounded-full bg-emerald-500 text-lg font-semibold hover:bg-emerald-600 transition shadow-lg"
            onClick={onAuthClick}
          >
            Try the Demo
          </button>
        </div>
        {/* Right – hero illustration */}
        <div className="flex-1 flex justify-center md:justify-end items-center w-full">
          <div className="relative w-full flex justify-center">
            {/* main image */}
            <img
              src={heroImg}
              alt="Sticky notes illustration"
              className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg drop-shadow-2xl rounded-lg"
            />
            {/* decorative floating duplicate for a layered feel */}
            <img
              src={heroImg}
              aria-hidden
              className="absolute -top-8 -left-8 w-1/3 rotate-[-6deg] opacity-60 blur-sm pointer-events-none hidden md:block"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
