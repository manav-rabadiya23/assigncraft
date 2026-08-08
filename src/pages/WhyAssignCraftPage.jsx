import {
  FaBolt,
  FaCheckCircle,
  FaClock,
  FaFileAlt,
  FaLayerGroup,
  FaMagic,
  FaArrowRight,
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
  "Copy questions one by one",
  "Fix numbering manually",
  "Create tables and blank spaces",
  "Repeat student details",
  "Adjust the final layout",
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main>
        <section className="overflow-hidden bg-slate-950 text-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-300">
                <FaBolt />
                Why AssignCraft
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                Assignments should take time to complete —
                <span className="text-indigo-400"> not to format.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                AssignCraft was created to reduce repetitive document work so students can focus more on the actual assignment.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-7 backdrop-blur">
              <p className="text-sm font-bold text-indigo-300">The idea is simple</p>

              <div className="mt-5 space-y-4">
                {["Give your questions", "Review and customize", "Generate the document"].map(
                  (item, index) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-black text-white">
                        {index + 1}
                      </div>
                      <span className="font-bold text-white">{item}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <article
                  key={benefit.title}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-lg text-indigo-600">
                    <Icon />
                  </div>

                  <h2 className="mt-5 text-lg font-black">{benefit.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{benefit.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="grid md:grid-cols-2">
              <div className="border-b border-slate-200 p-7 md:border-b-0 md:border-r">
                <div className="flex items-center gap-3">
                  <FaFileAlt className="text-xl text-slate-400" />
                  <h2 className="text-xl font-black">Without AssignCraft</h2>
                </div>

                <div className="mt-6 space-y-3">
                  {manual.map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-slate-600">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 font-bold text-red-500">×</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-indigo-50/40 p-7">
                <div className="flex items-center gap-3">
                  <FaMagic className="text-xl text-indigo-600" />
                  <h2 className="text-xl font-black">With AssignCraft</h2>
                </div>

                <div className="mt-6 space-y-3">
                  {withAssignCraft.map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                      <FaCheckCircle className="text-emerald-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              Try AssignCraft
              <FaArrowRight className="text-xs" />
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
