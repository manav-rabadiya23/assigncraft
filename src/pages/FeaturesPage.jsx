import SEO from "../components/SEO";

import {
  FaArrowDown,
  FaArrowsAltV,
  FaCheckCircle,
  FaClipboard,
  FaCog,
  FaEye,
  FaFilePdf,
  FaFileUpload,
  FaFileWord,
  FaLayerGroup,
  FaMagic,
  FaPrint,
  FaPython,
  FaSearch,
  FaSlidersH,
  FaTable,
  FaUserEdit,
} from "react-icons/fa";

import Header from "../components/Header";
import SiteFooter from "../components/SiteFooter";

const featureSections = [
  {
    id: "question-processing",
    number: "01",
    eyebrow: "Question Processing",
    title: "Process questions from different sources",
    description:
      "Bring existing question content into AssignCraft and prepare it for assignment creation.",
    color: "slate",

    features: [
      {
        icon: FaFileUpload,
        title: "PDF & DOCX Support",
        text: "Upload supported PDF and Word files containing assignment questions.",
      },
      {
        icon: FaLayerGroup,
        title: "Multiple File Upload",
        text: "Use multiple supported files as sources for the questions you want to include.",
      },
      {
        icon: FaClipboard,
        title: "Copy & Paste Questions",
        text: "Paste question content directly when your questions are already available as text.",
      },
      {
        icon: FaSearch,
        title: "Question Detection",
        text: "Identify individual questions from supported numbering and question formats.",
      },
      {
        icon: FaSearch,
        title: "OCR Support",
        text: "Process scanned PDF content when normal text extraction is not available.",
      },
      {
        icon: FaTable,
        title: "Multiline Question Handling",
        text: "Handle question text that continues across multiple lines.",
      },
    ],
  },

  {
    id: "assignment-builder",
    number: "02",
    eyebrow: "Assignment Builder",
    title: "Build the assignment your way",
    description:
      "Keep your questions and assignment information together while preparing the final document.",
    color: "indigo",

    features: [
      {
        icon: FaUserEdit,
        title: "Student Information",
        text: "Add details such as Full Name, Student ID and Division.",
      },
      {
        icon: FaClipboard,
        title: "Course & Subject Details",
        text: "Add Course Name, Subject and Subject Code information.",
      },
      {
        icon: FaClipboard,
        title: "Assignment Number",
        text: "Specify the assignment number that should appear in the document.",
      },
      {
        icon: FaMagic,
        title: "Custom Details",
        text: "Add additional fields such as Semester, Batch, Faculty Name or College Name.",
      },
      {
        icon: FaArrowsAltV,
        title: "Question List Control",
        text: "Manage the question collection before generating the final document.",
      },
      {
        icon: FaCheckCircle,
        title: "Automatic Numbering",
        text: "Keep question numbering organized when the question list changes.",
      },
    ],
  },

  {
    id: "document-builder",
    number: "03",
    eyebrow: "Document Builder",
    title: "Customize the structure of your document",
    description:
      "Choose the information and document sections that should appear in your generated assignment.",
    color: "violet",

    features: [
      {
        icon: FaSlidersH,
        title: "Header Customization",
        text: "Choose which assignment details should appear in the document header.",
      },
      {
        icon: FaCog,
        title: "Footer & Page Numbers",
        text: "Configure footer information and page numbering for generated documents.",
      },
      {
        icon: FaTable,
        title: "Code & Output Sections",
        text: "Include Code and Output areas for programming assignments when required.",
      },
      {
        icon: FaCog,
        title: "Document Options",
        text: "Select which available details and sections should be included in the final document.",
      },
      {
        icon: FaLayerGroup,
        title: "Structured Layout",
        text: "Generate assignments using a consistent document structure instead of manually formatting every section.",
      },
    ],
  },

  {
    id: "document-output",
    number: "04",
    eyebrow: "Document Output",
    title: "Preview and generate your final document",
    description:
      "Check your assignment and choose the output format that fits your needs.",
    color: "purple",

    features: [
      {
        icon: FaEye,
        title: "Assignment Preview",
        text: "Review the assignment structure before generating the final file.",
      },
      {
        icon: FaFileWord,
        title: "Word Export",
        text: "Generate an editable DOCX assignment document.",
      },
      {
        icon: FaFilePdf,
        title: "PDF Export",
        text: "Generate a PDF version of the assignment.",
      },
      {
        icon: FaPrint,
        title: "Print",
        text: "Open the assignment in a print-ready format.",
      },
      {
        icon: FaLayerGroup,
        title: "Merge Assignment",
        text: "Use the dedicated Merge Assignment tool when multiple assignment documents need to be combined.",
      },
    ],
  },

  {
    id: "jupyter-tools",
    number: "05",
    eyebrow: "Jupyter / Python Tools",
    title: "A separate workflow for Python assignments",
    description:
      "Jupyter Tools is designed for creating and continuing Python assignment notebooks from question documents.",
    color: "python",

    features: [
      {
        icon: FaPython,
        title: "Create Jupyter Notebook",
        text: "Use PDF or DOCX questions to create a .ipynb notebook.",
      },
      {
        icon: FaPython,
        title: "Question + Python Code Cells",
        text: "Place each question as Markdown content followed by a Python code cell for writing the solution.",
      },
      {
        icon: FaLayerGroup,
        title: "Continue Existing Notebook",
        text: "Use an existing .ipynb notebook and add additional questions to it.",
      },
      {
        icon: FaCheckCircle,
        title: "Preserve Existing Work",
        text: "Keep existing notebook cells and outputs when continuing an existing notebook.",
      },
      {
        icon: FaFilePdf,
        title: "Notebook to PDF",
        text: "Convert a completed Jupyter Notebook into a PDF document.",
      },
      {
        icon: FaSearch,
        title: "Notebook Structure",
        text: "Work with detected question numbering and notebook structure when continuing assignments.",
      },
    ],
  },

  {
    id: "review-control",
    number: "06",
    eyebrow: "Review & Control",
    title: "You remain in control of the final result",
    description:
      "Automated processing helps reduce repetitive work, while review and correction remain part of the workflow.",
    color: "slate",

    features: [
      {
        icon: FaEye,
        title: "Review Before Export",
        text: "Check detected questions, assignment details and document settings before generating the final file.",
      },
      {
        icon: FaUserEdit,
        title: "Manual Corrections",
        text: "Correct extracted or detected content when changes are required.",
      },
      {
        icon: FaCheckCircle,
        title: "Final Verification",
        text: "Review questions, names, numbers, formatting and other details before submitting or printing.",
      },
    ],
  },
];

const colorStyles = {
  slate: {
    panel: "bg-slate-950",
    eyebrow: "text-indigo-300",
    number: "bg-slate-900 text-white",
    navNumber: "bg-slate-900 text-white",
    line: "from-slate-300 via-indigo-400 to-indigo-500",
  },

  indigo: {
    panel: "bg-indigo-600",
    eyebrow: "text-indigo-100",
    number: "bg-indigo-600 text-white",
    navNumber: "bg-indigo-600 text-white",
    line: "from-indigo-300 via-violet-400 to-violet-500",
  },

  violet: {
    panel: "bg-violet-600",
    eyebrow: "text-violet-100",
    number: "bg-violet-600 text-white",
    navNumber: "bg-violet-600 text-white",
    line: "from-violet-300 via-purple-400 to-purple-500",
  },

  purple: {
    panel: "bg-purple-600",
    eyebrow: "text-purple-100",
    number: "bg-purple-600 text-white",
    navNumber: "bg-purple-600 text-white",
    line: "from-purple-300 via-indigo-400 to-indigo-500",
  },

  python: {
    panel: "bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950",
    eyebrow: "text-indigo-200",
    number: "bg-indigo-600 text-white",
    navNumber: "bg-indigo-600 text-white",
    line: "from-indigo-300 via-violet-400 to-purple-500",
  },
};

export default function FeaturesPage() {
  return (
    <>
      <SEO
        title="AssignCraft Features – PDF, DOCX, OCR & Assignment Tools"
        description="Explore AssignCraft features including PDF and DOCX support, OCR, question detection, assignment customization, header and footer options, Word and PDF export, and Jupyter tools."
        path="/features"
        keywords="AssignCraft features, PDF assignment generator, DOCX assignment generator, OCR question detection, Word assignment generator, PDF assignment tool, assignment customization, Jupyter assignment tool"
        breadcrumbs={[
          {
            name: "Home",
            path: "/",
          },
          {
            name: "Features",
            path: "/features",
          },
        ]}
      />
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Header />

        <main>
          {/* =====================================================
            HERO
        ===================================================== */}
          <section className="relative overflow-hidden border-b border-slate-200 bg-white">
            <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-indigo-100/70 blur-3xl" />

            <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-violet-100/70 blur-3xl" />

            <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:py-20 lg:py-24">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-violet-700">
                <FaSlidersH />
                AssignCraft Features
              </div>

              <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                AssignCraft Features
                <span className="block text-indigo-600">
                  PDF, DOCX, OCR & Assignment Tools
                </span>
              </h1>
              <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                Explore the tools available for question processing, assignment
                building, document customization, document output, and Python
                notebook workflows.
              </p>

              {/* Feature navigation */}
              <div className="mx-auto mt-12 max-w-5xl">
                <div className="relative">
                  {/* Connecting line */}
                  <div className="absolute left-[7%] right-[7%] top-6 hidden h-px bg-gradient-to-r from-slate-300 via-indigo-400 to-purple-400 lg:block" />

                  {/* Six sections */}
                  <div className="grid grid-cols-2 gap-7 sm:grid-cols-3 lg:grid-cols-6 lg:gap-2">
                    {featureSections.map((section) => {
                      const style = colorStyles[section.color];

                      return (
                        <a
                          key={section.id}
                          href={`#${section.id}`}
                          className="group relative"
                        >
                          <div
                            className={`relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-full text-xs font-black shadow-lg transition duration-300 group-hover:scale-110 ${style.navNumber}`}
                          >
                            {section.number}

                            <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-indigo-400/20" />
                          </div>

                          <p className="mt-3 text-xs font-black leading-4 text-slate-700 transition group-hover:text-indigo-600">
                            {section.eyebrow}
                          </p>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================
            FEATURE SECTIONS
        ===================================================== */}
          <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
            {featureSections.map((section, sectionIndex) => {
              const style = colorStyles[section.color];

              return (
                <div key={section.id}>
                  <section
                    id={section.id}
                    className="scroll-mt-28 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:shadow-xl"
                  >
                    <div className="grid lg:grid-cols-[0.36fr_0.64fr]">
                      {/* Left panel */}
                      <div
                        className={`relative overflow-hidden p-7 text-white sm:p-9 ${style.panel}`}
                      >
                        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

                        <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-white/10 blur-3xl" />

                        <div className="relative">
                          <div className="flex items-center justify-between">
                            <p
                              className={`text-xs font-black uppercase tracking-[0.18em] ${style.eyebrow}`}
                            >
                              {section.eyebrow}
                            </p>

                            <div
                              className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-black ${style.number}`}
                            >
                              {section.number}
                            </div>
                          </div>

                          <h2 className="mt-5 text-2xl font-black leading-tight sm:text-3xl">
                            {section.title}
                          </h2>

                          <p className="mt-4 text-sm leading-7 text-white/75">
                            {section.description}
                          </p>

                          <div className="mt-8 flex items-center gap-2 text-xs font-bold text-white/50">
                            <span className="h-px w-8 bg-white/30" />
                            FEATURE AREA {section.number}
                          </div>
                        </div>
                      </div>

                      {/* Feature cards */}
                      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
                        {section.features.map((feature, featureIndex) => {
                          const Icon = feature.icon;

                          return (
                            <article
                              key={feature.title}
                              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-5 transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-lg"
                            >
                              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-100/50 opacity-0 blur-2xl transition duration-300 group-hover:opacity-100" />

                              <div className="relative">
                                <div className="flex items-start justify-between">
                                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm transition duration-300 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white">
                                    <Icon />
                                  </div>

                                  <span className="text-xs font-black text-slate-300">
                                    {String(featureIndex + 1).padStart(2, "0")}
                                  </span>
                                </div>

                                <h3 className="mt-5 font-black text-slate-900">
                                  {feature.title}
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  {feature.text}
                                </p>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  </section>

                  {/* Animated section connector */}
                  {sectionIndex < featureSections.length - 1 && (
                    <div className="flex h-16 items-center justify-center">
                      <div className="relative flex h-full w-8 items-center justify-center">
                        <div
                          className={`absolute h-full w-px bg-gradient-to-b ${style.line}`}
                        />

                        <span className="absolute top-1 h-2 w-2 animate-bounce rounded-full bg-indigo-500" />

                        <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-indigo-100 bg-white text-xs text-indigo-500 shadow-sm">
                          <FaArrowDown />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* =====================================================
            JUPYTER / PYTHON HIGHLIGHT
        ===================================================== */}
          <section className="border-y border-slate-200 bg-slate-950 text-white">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
              <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-300">
                    <FaPython />
                    Separate Python Tool
                  </div>

                  <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                    Jupyter Tools for Python assignments
                  </h2>

                  <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
                    Jupyter Tools is a separate workflow inside AssignCraft. It
                    helps turn assignment questions into Jupyter Notebook files
                    and continue existing notebooks.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["01", "Create", "PDF / DOCX → .ipynb"],
                    ["02", "Continue", "Existing .ipynb + questions"],
                    ["03", "Export", ".ipynb → PDF"],
                  ].map(([number, title, text]) => (
                    <div
                      key={number}
                      className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-indigo-400/30 hover:bg-white/10"
                    >
                      <span className="text-xs font-black text-indigo-400">
                        {number}
                      </span>

                      <h3 className="mt-3 font-black text-white">{title}</h3>

                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================
            FINAL CTA
        ===================================================== */}
          <section className="bg-white">
            <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-20">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl text-white shadow-lg shadow-indigo-200">
                <FaCheckCircle />
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                One platform
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                More than just an assignment generator.
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                AssignCraft brings question processing, assignment building,
                document customization, document output, and Python notebook
                tools together in one place.
              </p>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
