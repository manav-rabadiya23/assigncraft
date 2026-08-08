import {
  FaFilePdf,
  FaFileWord,
  FaArrowRightLong,
  FaShieldHalved,
} from "react-icons/fa6";

export default function HomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-violet-700/20 bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_26%)]" />

      <div className="absolute -left-20 top-12 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-fuchsia-300/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-violet-50 backdrop-blur">
            <FaShieldHalved className="text-[12px]" />
            Browser-based PDF, OCR & Word Assignment Tool
          </div>

          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.04] tracking-[-0.04em] sm:text-5xl lg:text-[58px]">
            Turn question files into a
            <span className="block text-violet-100">ready assignment faster.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-violet-100 sm:text-lg">
            Upload PDF or Word files, review detected questions, customize the document, and export the final assignment to Word or PDF.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="#assignment-tool"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-violet-700 shadow-lg shadow-violet-950/20 transition hover:-translate-y-0.5 hover:bg-violet-50"
            >
              Start Creating
              <FaArrowRightLong className="text-[11px]" />
            </a>

            <div className="flex items-center gap-2 text-sm font-semibold text-violet-100">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                <FaFilePdf />
              </span>
              PDF
              <span className="mx-1 text-white/30">•</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                <FaFileWord />
              </span>
              DOCX
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="relative mx-auto max-w-md rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-violet-950/25 backdrop-blur-md">
            <div className="rounded-2xl bg-white p-5 text-slate-900 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">
                    Assignment Preview
                  </p>
                  <p className="mt-1 font-black">Python Programming</p>
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-600">
                  Ready
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-[105px_1fr] overflow-hidden rounded-xl border border-slate-200 text-xs">
                  <div className="bg-slate-50 px-3 py-2.5 font-bold">Student ID</div>
                  <div className="px-3 py-2.5 text-slate-600">24BCA196</div>
                </div>

                <div className="grid grid-cols-[105px_1fr] overflow-hidden rounded-xl border border-slate-200 text-xs">
                  <div className="bg-slate-50 px-3 py-2.5 font-bold">Subject</div>
                  <div className="px-3 py-2.5 text-slate-600">Python Programming</div>
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs font-black">Question 1</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Write a Python program to find the largest number from a list.
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 rounded-2xl border border-white/20 bg-slate-950 px-4 py-3 text-xs font-bold text-white shadow-xl">
              Preview • Word • PDF • Print
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
