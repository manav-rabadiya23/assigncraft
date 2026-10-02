import SEO from "../components/SEO";

import {
  FaBolt,
  FaCheckCircle,
  FaClock,
  FaFileAlt,
  FaLayerGroup,
  FaMagic,
  FaArrowRight,
  FaCopy,
  FaSort,
  FaTable,
  FaUser,
  FaEye,
} from "react-icons/fa";

import Header from "../components/Header";
import SiteFooter from "../components/SiteFooter";

const benefits = [
  {
    icon: FaClock,
    title: "Save Time",
    text: "Spend less time copying questions and repeatedly formatting assignment documents.",
  },
  {
    icon: FaLayerGroup,
    title: "Stay Organized",
    text: "Keep questions, assignment details and document options together in one workflow.",
  },
  {
    icon: FaBolt,
    title: "Work Faster",
    text: "Upload files, paste extra questions, review everything and generate the final document.",
  },
  {
    icon: FaMagic,
    title: "Customize Easily",
    text: "Choose exactly which details, headers and answer sections should appear.",
  },
];

const manual = [
  {
    icon: FaCopy,
    text: "Copy questions one by one",
  },
  {
    icon: FaSort,
    text: "Fix numbering manually",
  },
  {
    icon: FaTable,
    text: "Create tables and blank spaces",
  },
  {
    icon: FaUser,
    text: "Repeat student details",
  },
  {
    icon: FaEye,
    text: "Adjust the final layout",
  },
];

const withAssignCraft = [
  "Import questions automatically",
  "Reorder with drag & drop",
  "Use ready document structure",
  "Reuse saved student details",
  "Preview before export",
];

export default function WhyAssignCraftPage() {
  return (
    <>
      <SEO
        title="Why AssignCraft – Simplify Assignment Preparation"
        description="Learn how AssignCraft reduces repetitive assignment preparation work by helping students import questions, organize content, customize documents and preview assignments before export."
        path="/why-assigncraft"
        keywords="why AssignCraft, assignment preparation tool, assignment formatting tool, student assignment generator, assignment document automation, PDF assignment tool"
        breadcrumbs={[
          {
            name: "Home",
            path: "/",
          },
          {
            name: "Why AssignCraft",
            path: "/why-assigncraft",
          },
        ]}
      />
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Header />

        <main>
          {/* =========================================================
            HERO
        ========================================================= */}
          <section className="relative overflow-hidden bg-slate-950 text-white">
            {/* Background glow */}
            <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
            <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />

            <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
              {/* Left */}
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-300">
                  <FaBolt />
                  Why AssignCraft
                </div>

                <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                  Simplify Assignment Preparation with AssignCraft
                  <span className="text-indigo-400">
                    Less repetitive formatting, more focus on your work.
                  </span>
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                  AssignCraft was created to reduce repetitive document work so
                  students can focus more on the actual assignment.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="/"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-500"
                  >
                    Try AssignCraft
                    <FaArrowRight className="text-xs" />
                  </a>

                  <a
                    href="/how-it-works"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10"
                  >
                    See How It Works
                  </a>
                </div>
              </div>

              {/* Right - animated idea card */}
              <div className="relative">
                <div className="absolute -inset-4 rounded-[2.5rem] bg-indigo-500/10 blur-2xl" />

                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 shadow-2xl backdrop-blur">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-indigo-300">
                      The idea is simple
                    </p>

                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
                  </div>

                  <div className="relative mt-8">
                    {/* vertical animated line */}
                    <div className="absolute left-[19px] top-5 h-[calc(100%-40px)] w-px bg-gradient-to-b from-indigo-500/70 via-violet-500/50 to-transparent" />

                    {[
                      "Give your questions",
                      "Review and customize",
                      "Generate the document",
                    ].map((item, index) => (
                      <div
                        key={item}
                        className="group relative mb-7 flex items-center gap-4 last:mb-0"
                      >
                        <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-indigo-400/30 bg-indigo-500 text-sm font-black text-white shadow-lg shadow-indigo-950/40">
                          {index + 1}

                          <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400/20" />
                        </div>

                        <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition group-hover:border-indigo-400/30 group-hover:bg-white/10">
                          <span className="text-sm font-bold text-white">
                            {item}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 rounded-xl border border-indigo-400/10 bg-indigo-500/10 px-4 py-3">
                    <p className="text-xs leading-5 text-indigo-100">
                      Less repetitive formatting. More focus on the actual
                      assignment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================
            BENEFITS
        ========================================================= */}
          <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                Why use it?
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Built around the repetitive parts of assignments
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                AssignCraft brings the common document preparation tasks into
                one workflow.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <article
                    key={benefit.title}
                    className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/40"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-lg text-indigo-600 transition duration-300 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white">
                      <Icon />
                    </div>

                    <h2 className="mt-5 text-lg font-black text-slate-950">
                      {benefit.title}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {benefit.text}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          {/* =========================================================
            COMPARISON
        ========================================================= */}
          <section className="border-y border-slate-200 bg-white">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                  The Difference
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Less repetitive work. One focused workflow.
                </h2>

                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                  See how the assignment preparation process changes when the
                  repetitive document work is brought into one place.
                </p>
              </div>

              <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
                {/* Without */}
                <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-7">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                      <FaFileAlt />
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Manual process
                      </p>

                      <h3 className="mt-1 text-xl font-black text-slate-900">
                        Without AssignCraft
                      </h3>
                    </div>
                  </div>

                  <div className="mt-7 space-y-3">
                    {manual.map((item, index) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.text}
                          className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-xs text-red-500">
                            <Icon />
                          </div>

                          <span className="text-sm text-slate-600">
                            {item.text}
                          </span>

                          <span className="ml-auto text-xs font-black text-slate-300">
                            0{index + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Center connector */}
                <div className="hidden items-center justify-center lg:flex">
                  <div className="relative flex h-full w-16 items-center justify-center">
                    <div className="absolute h-px w-full bg-gradient-to-r from-slate-200 via-indigo-300 to-indigo-500" />

                    <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-indigo-200 bg-white text-indigo-600 shadow-sm">
                      <FaArrowRight />
                    </div>

                    <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-indigo-500" />
                  </div>
                </div>

                {/* Mobile connector */}
                <div className="flex items-center justify-center lg:hidden">
                  <div className="relative h-12 w-full max-w-[220px]">
                    <div className="absolute left-1/2 top-0 h-12 w-px -translate-x-1/2 bg-gradient-to-b from-slate-300 to-indigo-400" />

                    <div className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-indigo-200 bg-white text-indigo-600 shadow-sm">
                      <FaArrowRight className="rotate-90" />
                    </div>
                  </div>
                </div>

                {/* With */}
                <div className="relative overflow-hidden rounded-[2rem] border border-indigo-200 bg-indigo-50/50 p-7">
                  <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-200/30 blur-3xl" />

                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                        <FaMagic />
                      </div>

                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-indigo-600">
                          AssignCraft workflow
                        </p>

                        <h3 className="mt-1 text-xl font-black text-slate-950">
                          With AssignCraft
                        </h3>
                      </div>
                    </div>

                    <div className="mt-7 space-y-3">
                      {withAssignCraft.map((item, index) => (
                        <div
                          key={item}
                          className="group flex items-center gap-3 rounded-xl border border-indigo-100 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                            <FaCheckCircle className="text-sm text-emerald-500" />
                          </div>

                          <span className="text-sm font-medium text-slate-700">
                            {item}
                          </span>

                          <span className="ml-auto text-xs font-black text-indigo-200">
                            0{index + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================
            CTA
        ========================================================= */}
          <section className="bg-slate-950">
            <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-20">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl text-white shadow-lg shadow-indigo-950/50">
                <FaMagic />
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Spend less time formatting.
                <br />
                <span className="text-indigo-400">
                  Spend more time on your assignment.
                </span>
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-300">
                Upload your questions, review the detected content, customize
                your document and generate the final assignment.
              </p>

              <a
                href="/"
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-500 hover:shadow-xl"
              >
                Try AssignCraft
                <FaArrowRight className="text-xs" />
              </a>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
