import SEO from "../components/SEO";

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
  FaSearch,
  FaFileWord,
} from "react-icons/fa";

import Header from "../components/Header";
import SiteFooter from "../components/SiteFooter";

const steps = [
  {
    number: "01",
    icon: FaFileUpload,
    title: "Upload Your Question File",
    text: "Start by uploading your teacher's PDF or Word document. AssignCraft reads the uploaded file and prepares its content for question detection.",
    points: [
      "PDF and DOCX support",
      "Upload your assignment question file",
      "OCR support for scanned PDFs",
    ],
  },
  {
    number: "02",
    icon: FaSearch,
    title: "Detect Questions",
    text: "AssignCraft analyzes the uploaded content and identifies individual questions from different numbering and question formats.",
    points: [
      "Automatic question detection",
      "Supports different question formats",
      "Multiline question support",
    ],
  },
  {
    number: "03",
    icon: FaKeyboard,
    title: "Add or Edit Questions",
    text: "Review the detected questions and make changes when required. You can also add questions manually if something was missed.",
    points: [
      "Edit question text",
      "Add missing questions",
      "Remove unwanted questions",
    ],
  },
  {
    number: "04",
    icon: FaListOl,
    title: "Arrange Your Questions",
    text: "Put your questions in the required order before generating the assignment.",
    points: [
      "Drag and drop questions",
      "Change question order",
      "Automatic numbering",
    ],
  },
  {
    number: "05",
    icon: FaClipboardCheck,
    title: "Enter Assignment Details",
    text: "Add the information that should appear in your assignment document, such as student and subject details.",
    points: [
      "Course and subject details",
      "Student information",
      "Assignment number",
      "Custom details",
    ],
  },
  {
    number: "06",
    icon: FaSlidersH,
    title: "Customize Document Options",
    text: "Choose which information should appear in the generated document and customize the document structure.",
    points: [
      "Header and footer fields",
      "Code and Output sections",
      "Page numbers",
      "Choose displayed details",
    ],
  },
  {
    number: "07",
    icon: FaEye,
    title: "Review the Assignment",
    text: "Check the generated assignment before downloading it. This gives you a final opportunity to identify and correct mistakes.",
    points: [
      "Review questions",
      "Check student details",
      "Check formatting and layout",
    ],
  },
  {
    number: "08",
    icon: FaDownload,
    title: "Generate & Download",
    text: "Once everything is verified, generate the final assignment and download it in the format you need.",
    points: [
      "Download Word document",
      "Download PDF",
      "Print-ready assignment",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <SEO
        title="How AssignCraft Works – Create Assignments from PDF & Word"
        description="Learn how AssignCraft turns teacher PDF or Word question files into structured assignments through question detection, editing, customization, review and Word or PDF export."
        path="/how-it-works"
        keywords="how AssignCraft works, create assignment from PDF, create assignment from Word, PDF to assignment, Word assignment generator, question detection, assignment document generator"
        breadcrumbs={[
          {
            name: "Home",
            path: "/",
          },
          {
            name: "How It Works",
            path: "/how-it-works",
          },
        ]}
      />

      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Header />

        <main>
          {/* Hero */}
          <section className="relative overflow-hidden border-b border-slate-200 bg-white">
            <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-indigo-100/70 blur-3xl" />
            <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-violet-100/70 blur-3xl" />

            <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:py-20">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
                <FaClipboardCheck />
                How AssignCraft Works
              </div>

              <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                From Question File to Ready Assignment - How to Create an
                Assignment from PDF or Word
              </h1>

              <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                Upload your teacher's PDF or Word question file, verify detected
                questions, customize your assignment, review the result and
                generate the final Word or PDF document with AssignCraft.
              </p>
            </div>
          </section>

          {/* Workflow */}
          <section className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
            <div className="relative">
              {/* Desktop connecting line */}
              <div className="absolute left-1/2 top-8 hidden h-[calc(100%-4rem)] w-px -translate-x-1/2 bg-gradient-to-b from-indigo-200 via-violet-300 to-indigo-200 lg:block" />

              <div className="space-y-8 lg:space-y-10">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isEven = index % 2 === 1;

                  return (
                    <div
                      key={step.number}
                      className={`relative flex flex-col lg:flex-row ${
                        isEven ? "lg:justify-end" : "lg:justify-start"
                      }`}
                    >
                      {/* Step card */}
                      <article className="group relative w-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/40 lg:w-[calc(50%-2.5rem)]">
                        <div className="absolute right-5 top-3 text-6xl font-black text-slate-100">
                          {step.number}
                        </div>

                        <div className="relative">
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg text-white shadow-lg shadow-indigo-200">
                              <Icon />
                            </div>

                            <div className="pr-8">
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
                              <div
                                key={point}
                                className="flex items-center gap-2 text-sm text-slate-700"
                              >
                                <FaCheckCircle className="shrink-0 text-emerald-500" />
                                <span>{point}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </article>

                      {/* Center step indicator */}
                      <div className="absolute left-1/2 top-7 z-10 hidden h-5 w-5 -translate-x-1/2 rounded-full border-4 border-white bg-indigo-600 shadow-md lg:block" />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Verification notice */}
          <section className="mx-auto max-w-4xl px-4 py-14 sm:py-16">
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center sm:p-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-amber-500 shadow-sm">
                <FaClipboardCheck />
              </div>

              <h2 className="mt-4 text-2xl font-black text-slate-950">
                Always Verify Your Final Assignment
              </h2>

              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Automated processing can sometimes make mistakes while reading,
                extracting, or formatting content. Review your questions,
                details, numbers, and final document before submitting it.
              </p>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-slate-950">
            <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:py-16">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl text-white shadow-lg shadow-indigo-950/40">
                <FaFileWord />
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Ready to create your assignment?
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-300">
                Upload your question file and let AssignCraft handle the
                repetitive document preparation.
              </p>

              <a
                href="/"
                className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-500"
              >
                Start Creating
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
