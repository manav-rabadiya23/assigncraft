import {
  FaArrowRight,
  FaCheckCircle,
  FaClipboardCheck,
  FaFileUpload,
  FaKeyboard,
  FaListOl,
  FaSlidersH,
  FaEye,
  FaDownload,
} from "react-icons/fa";

import Header from "../components/Header";
import SiteFooter from "../components/SiteFooter";

const steps = [
  {
    number: "01",
    icon: FaFileUpload,
    title: "Upload Your Files",
    text: "Upload one or multiple PDF or DOCX files. AssignCraft reads the content and detects assignment questions automatically.",
    points: ["PDF and DOCX support", "Multiple files together", "OCR support for scanned PDFs"],
  },
  {
    number: "02",
    icon: FaKeyboard,
    title: "Paste Extra Questions",
    text: "Already have questions in WhatsApp, notes or another document? Paste them directly and add them to the same assignment.",
    points: ["Paste multiple questions", "Automatic question separation", "Works together with uploaded files"],
  },
  {
    number: "03",
    icon: FaListOl,
    title: "Review & Arrange",
    text: "Check every detected question before generating your assignment and fix anything that needs attention.",
    points: ["Edit or delete questions", "Drag & drop ordering", "Automatic numbering"],
  },
  {
    number: "04",
    icon: FaClipboardCheck,
    title: "Enter Assignment Details",
    text: "Add your course, student, subject and assignment information. You can also add your own custom details.",
    points: ["Predefined student details", "Custom detail fields", "Choose what should appear"],
  },
  {
    number: "05",
    icon: FaSlidersH,
    title: "Customize the Document",
    text: "Choose the document settings that match your college or assignment requirements.",
    points: ["Code / Output sections", "Repeating header", "Page numbers"],
  },
  {
    number: "06",
    icon: FaEye,
    title: "Preview Before Export",
    text: "Check the final assignment layout before creating the document so you can fix mistakes first.",
    points: ["Word-style preview", "Selected details visible", "Questions in final order"],
  },
  {
    number: "07",
    icon: FaDownload,
    title: "Download or Print",
    text: "When everything looks correct, generate your assignment in the format you need.",
    points: ["Download Word", "Download PDF", "Print-ready output"],
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-indigo-100/70 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-violet-100/70 blur-3xl" />

          <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:py-20">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
              <FaClipboardCheck />
              Simple Process
            </div>

            <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              From Questions to a Ready Assignment
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              AssignCraft reduces repetitive formatting work and turns your question files into a clean assignment document in a few simple steps.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
          <div className="grid gap-6 lg:grid-cols-2">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.number}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/40"
                >
                  <div className="absolute right-5 top-4 text-6xl font-black text-slate-100">
                    {step.number}
                  </div>

                  <div className="relative">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg text-white shadow-lg shadow-indigo-200">
                        <Icon />
                      </div>

                      <div className="pr-10">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">
                          Step {step.number}
                        </p>
                        <h2 className="mt-1 text-xl font-black text-slate-950">
                          {step.title}
                        </h2>
                      </div>
                    </div>

                    <p className="mt-5 text-sm leading-7 text-slate-600">
                      {step.text}
                    </p>

                    <div className="mt-5 space-y-2">
                      {step.points.map((point) => (
                        <div key={point} className="flex items-center gap-2 text-sm text-slate-700">
                          <FaCheckCircle className="shrink-0 text-emerald-500" />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-10 flex justify-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              Start Creating
              <FaArrowRight className="text-xs" />
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
