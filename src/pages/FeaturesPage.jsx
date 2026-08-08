import {
  FaArrowsAltV,
  FaCheckCircle,
  FaClipboard,
  FaCog,
  FaEye,
  FaFilePdf,
  FaFileUpload,
  FaFileWord,
  FaPrint,
  FaSearch,
  FaSlidersH,
  FaUserEdit,
} from "react-icons/fa";

import Header from "../components/Header";
import SiteFooter from "../components/SiteFooter";

const sections = [
  {
    id: "question-input",
    eyebrow: "Question Input",
    title: "Bring your questions into AssignCraft",
    description: "Start from the files or text you already have instead of typing everything again.",
    features: [
      {
        icon: FaFileUpload,
        title: "Multiple File Upload",
        text: "Upload multiple PDF and DOCX files and combine detected questions into one assignment.",
      },
      {
        icon: FaClipboard,
        title: "Copy & Paste Questions",
        text: "Paste question lists directly from notes, websites, chats or other documents.",
      },
      {
        icon: FaSearch,
        title: "OCR Support",
        text: "Read scanned PDF pages when normal text extraction is not available.",
      },
    ],
  },
  {
    id: "question-management",
    eyebrow: "Question Management",
    title: "Review and organize before you generate",
    description: "Keep full control of the detected questions before creating the final document.",
    features: [
      {
        icon: FaUserEdit,
        title: "Edit & Delete",
        text: "Correct question text or remove questions you do not need.",
      },
      {
        icon: FaArrowsAltV,
        title: "Drag & Drop",
        text: "Change question order visually while numbering updates automatically.",
      },
      {
        icon: FaCheckCircle,
        title: "Automatic Numbering",
        text: "Question numbers remain correct after adding, deleting or reordering.",
      },
    ],
  },
  {
    id: "customization",
    eyebrow: "Customization",
    title: "Match your assignment requirements",
    description: "Control the student details and document settings without manually editing the final file.",
    features: [
      {
        icon: FaUserEdit,
        title: "Custom Assignment Details",
        text: "Add fields such as Semester, Batch, Faculty Name or College Name.",
      },
      {
        icon: FaSlidersH,
        title: "Document Options",
        text: "Choose displayed details, Code/Output sections, repeating headers and page numbers.",
      },
      {
        icon: FaCog,
        title: "Flexible Output",
        text: "Use the same selected settings across Preview, Word, PDF and Print.",
      },
    ],
  },
  {
    id: "export",
    eyebrow: "Preview & Export",
    title: "Check it once, then generate",
    description: "Preview the assignment before choosing the output format you need.",
    features: [
      {
        icon: FaEye,
        title: "Live Preview",
        text: "Review your final assignment structure before downloading anything.",
      },
      {
        icon: FaFileWord,
        title: "Word Export",
        text: "Generate an editable DOCX assignment document.",
      },
      {
        icon: FaFilePdf,
        title: "PDF Export",
        text: "Create a ready-to-submit or share PDF document.",
      },
      {
        icon: FaPrint,
        title: "Print",
        text: "Open the same assignment in a print-ready format.",
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-violet-700">
              <FaSlidersH />
              AssignCraft Features
            </div>

            <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Everything You Need to Prepare the Document
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">
              Focused tools for importing questions, organizing them, customizing the assignment and generating the final document.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-10 px-4 py-14">
          {sections.map((section, sectionIndex) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-28 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
            >
              <div className="grid lg:grid-cols-[0.36fr_0.64fr]">
                <div className={`p-7 sm:p-8 ${sectionIndex % 2 === 0 ? "bg-slate-950 text-white" : "bg-indigo-600 text-white"}`}>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-200">
                    {section.eyebrow}
                  </p>

                  <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
                    {section.title}
                  </h2>

                  <p className="mt-4 text-sm leading-7 text-slate-200">
                    {section.description}
                  </p>
                </div>

                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
                  {section.features.map((feature) => {
                    const Icon = feature.icon;

                    return (
                      <article
                        key={feature.title}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-indigo-200 hover:bg-indigo-50/40"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                          <Icon />
                        </div>

                        <h3 className="mt-4 font-black text-slate-900">
                          {feature.title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {feature.text}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
