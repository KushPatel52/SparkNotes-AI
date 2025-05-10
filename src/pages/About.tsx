import NavBar from "../components/NavBar";
import kushImg from "../assets/Kush.jpg";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <NavBar />

      {/* ------------- Section 1 : How it works ------------- */}
      <section className="w-full bg-blue-900 text-white flex flex-col items-center py-16 md:py-32 flex-shrink-0 min-h-[60vh]">
        <h2 className="text-3xl sm:text-4xl md:text-5xl xl:text-7xl font-extrabold mb-10 md:mb-20 text-center">How SnapNotes AI Works</h2>
        <div className="w-full flex justify-center overflow-x-auto">
          <div className="flex items-center gap-6 sm:gap-10 md:gap-12 xl:gap-20 px-2 sm:px-6 md:px-10 max-w-full md:max-w-6xl">
            {/* Step 1 */}
            <div className="bg-blue-800 rounded-2xl p-6 sm:p-8 md:p-10 min-w-[200px] sm:min-w-[220px] md:min-w-[260px] xl:min-w-[300px] flex flex-col items-center shadow-2xl scale-105">
              <div className="text-2xl sm:text-3xl md:text-5xl font-bold text-emerald-300 mb-2 md:mb-4">1</div>
              <div className="font-bold text-lg sm:text-xl md:text-2xl mb-1 md:mb-2">Capture</div>
              <div className="text-sm sm:text-base md:text-lg text-blue-100 text-center">The browser's <code>MediaDevices</code> API streams 30 fps video into a WebAssembly‑powered OpenCV pipeline.</div>
            </div>
            {/* Arrow */}
            <div className="text-3xl sm:text-4xl md:text-6xl text-emerald-300 hidden md:block">→</div>
            {/* Step 2 */}
            <div className="bg-blue-800 rounded-2xl p-6 sm:p-8 md:p-10 min-w-[200px] sm:min-w-[220px] md:min-w-[260px] xl:min-w-[300px] flex flex-col items-center shadow-2xl scale-105">
              <div className="text-2xl sm:text-3xl md:text-5xl font-bold text-emerald-300 mb-2 md:mb-4">2</div>
              <div className="font-bold text-lg sm:text-xl md:text-2xl mb-1 md:mb-2">Detect</div>
              <div className="text-sm sm:text-base md:text-lg text-blue-100 text-center">A tiny TF.js model (or classical edge+Hough) finds the board's four corners &amp; applies <code>cv.warpPerspective</code> for a flat, glare‑free image.</div>
            </div>
            <div className="text-3xl sm:text-4xl md:text-6xl text-emerald-300 hidden md:block">→</div>
            {/* Step 3 */}
            <div className="bg-blue-800 rounded-2xl p-6 sm:p-8 md:p-10 min-w-[200px] sm:min-w-[220px] md:min-w-[260px] xl:min-w-[300px] flex flex-col items-center shadow-2xl scale-105">
              <div className="text-2xl sm:text-3xl md:text-5xl font-bold text-emerald-300 mb-2 md:mb-4">3</div>
              <div className="font-bold text-lg sm:text-xl md:text-2xl mb-1 md:mb-2">Segment</div>
              <div className="text-sm sm:text-base md:text-lg text-blue-100 text-center">Frame differencing isolates new strokes; when &gt;K % pixels change in 4 s, that frame becomes a new "slide".</div>
            </div>
            <div className="text-3xl sm:text-4xl md:text-6xl text-emerald-300 hidden md:block">→</div>
            {/* Step 4 */}
            <div className="bg-blue-800 rounded-2xl p-6 sm:p-8 md:p-10 min-w-[200px] sm:min-w-[220px] md:min-w-[260px] xl:min-w-[300px] flex flex-col items-center shadow-2xl scale-105">
              <div className="text-2xl sm:text-3xl md:text-5xl font-bold text-emerald-300 mb-2 md:mb-4">4</div>
              <div className="font-bold text-lg sm:text-xl md:text-2xl mb-1 md:mb-2">Understand</div>
              <div className="text-sm sm:text-base md:text-lg text-blue-100 text-center">Tesseract.js extracts text; an optional TF.js model labels math symbols and diagrams.</div>
            </div>
            <div className="text-3xl sm:text-4xl md:text-6xl text-emerald-300 hidden md:block">→</div>
            {/* Step 5 */}
            <div className="bg-blue-800 rounded-2xl p-6 sm:p-8 md:p-10 min-w-[200px] sm:min-w-[220px] md:min-w-[260px] xl:min-w-[300px] flex flex-col items-center shadow-2xl scale-105">
              <div className="text-2xl sm:text-3xl md:text-5xl font-bold text-emerald-300 mb-2 md:mb-4">5</div>
              <div className="font-bold text-lg sm:text-xl md:text-2xl mb-1 md:mb-2">Export</div>
              <div className="text-sm sm:text-base md:text-lg text-blue-100 text-center">Slides + markdown zip client‑side with <code>jszip</code>; share via the Web Share API or sync to IndexedDB / Firebase.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------- Section 2 : About the developer ------------- */}
      <section className="w-full bg-green-100 text-blue-900 flex-1 flex flex-col items-center py-16 md:py-32 min-h-[60vh]">
        <h2 className="text-3xl sm:text-4xl md:text-5xl xl:text-7xl font-extrabold mb-8 md:mb-14 text-center">Meet the Developer</h2>
        <img
          src={kushImg}
          alt="Kush Patel"
          className="w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64 xl:w-80 xl:h-80 rounded-full border-8 border-emerald-400 shadow-2xl object-cover mb-8 md:mb-10 bg-white"
          style={{ boxShadow: "0 16px 48px 0 rgba(16, 185, 129, 0.18)" }}
        />
        <div className="text-lg sm:text-xl md:text-2xl leading-relaxed space-y-4 md:space-y-6 max-w-xl md:max-w-2xl text-center">
          <p className="italic text-gray-700">
            I'm Kush Patel, an AI‑obsessed developer who loves turning rough
            ideas into polished, accessible tools. (Replace this paragraph
            with your own story, background, and fun facts!)
          </p>
        </div>
      </section>
    </div>
  );
}
