import {
  DEVLOKS_URL,
  PORTFOLIO_URL,
} from "../constants/defaults";

const features = [
  {
    label: "Multiple File Upload",
    href: "#how-multi-file",
  },
  {
    label: "Copy & Paste Questions",
    href: "#how-copy-paste",
  },
  {
    label: "Hybrid Input",
    href: "#how-hybrid",
  },
  {
    label: "Drag & Drop Questions",
    href: "#how-drag-drop",
  },
  {
    label: "Custom Assignment Details",
    href: "#how-custom-details",
  },
  {
    label: "Live Preview",
    href: "#how-preview",
  },
  {
    label: "Word / PDF / Print",
    href: "#how-export",
  },
];

const howItWorksItems = [
  {
    id: "how-multi-file",
    number: "01",
    title: "Upload One or Multiple Files",
    text: "Upload PDF or DOCX files provided by your teacher. If you upload multiple files, AssignCraft reads questions from all of them and adds the detected questions to the same assignment.",
  },
  {
    id: "how-copy-paste",
    number: "02",
    title: "Copy & Paste Questions",
    text: "If you already have the questions in WhatsApp, notes, a website or another document, paste them directly. AssignCraft separates them into individual questions for you.",
  },
  {
    id: "how-hybrid",
    number: "03",
    title: "Use Both Together",
    text: "You can upload files and also paste extra questions in the same assignment. All questions are combined into one editable list.",
  },
  {
    id: "how-drag-drop",
    number: "04",
    title: "Review and Arrange Questions",
    text: "Check the detected questions before generating the assignment. Edit mistakes, delete unwanted questions, add a missing question, or drag questions to change their order.",
  },
  {
    id: "how-custom-details",
    number: "05",
    title: "Enter and Customize Assignment Details",
    text: "Fill in your course, name, student ID, division, subject and assignment details. You can also add your own custom details such as Semester, Batch, Faculty Name or College Name.",
  },
  {
    id: "how-preview",
    number: "06",
    title: "Preview the Assignment",
    text: "Use Preview to check the questions, selected student details, Code/Output sections, repeating header and page options before creating the final document.",
  },
  {
    id: "how-export",
    number: "07",
    title: "Download or Print",
    text: "When everything looks correct, download the assignment as a Word document or PDF, or open the printable version.",
  },
];

export function SiteNavbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <a
          href="#top"
          className="text-lg font-black tracking-tight text-indigo-700"
        >
          AssignCraft
        </a>

        <div className="hidden items-center gap-6 text-sm font-semibold text-slate-700 md:flex">
          <a
            href="#how-it-works"
            className="transition hover:text-indigo-600"
          >
            How It Works
          </a>

          <a
            href="#why-assigncraft"
            className="transition hover:text-indigo-600"
          >
            Why AssignCraft
          </a>

          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 transition hover:text-indigo-600"
            >
              Features
              <span className="text-xs">▼</span>
            </button>

            <div className="invisible absolute right-0 top-full z-50 w-72 translate-y-2 pt-3 opacity-0 transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-300/40">
                <p className="px-3 pb-2 pt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Learn how each feature works
                </p>

                {features.map((feature) => (
                  <a
                    key={feature.href}
                    href={feature.href}
                    className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    {feature.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <a
            href="#about-us"
            className="transition hover:text-indigo-600"
          >
            About Us
          </a>
        </div>

        <a
          href="#assignment-tool"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700"
        >
          Create Assignment
        </a>
      </div>
    </nav>
  );
}

export function SiteInformationSections() {
  return (
    <div className="space-y-8">
      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/20 sm:p-8"
      >
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
            Simple Process
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
            How AssignCraft Works
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Give AssignCraft your questions, review the detected content,
            customize the assignment and generate the final document.
          </p>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {howItWorksItems.map((item) => (
            <article
              key={item.id}
              id={item.id}
              className="scroll-mt-28 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition duration-200 target:border-indigo-400 target:bg-indigo-50 target:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white">
                  {item.number}
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.text}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* WHY ASSIGNCRAFT */}
      <section
        id="why-assigncraft"
        className="scroll-mt-24 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 shadow-xl shadow-indigo-100/50 sm:p-8"
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
            Built for Students
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
            Why AssignCraft?
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            Creating assignment files manually takes unnecessary time. Students
            repeatedly copy questions, arrange them one by one, enter the same
            details and format Code and Output spaces. AssignCraft makes this
            process faster and easier.
          </p>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white bg-white/80 p-5 shadow-sm">
            <h3 className="font-bold text-slate-900">Save Time</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Reduce repeated copying, question arranging and document
              formatting.
            </p>
          </div>

          <div className="rounded-2xl border border-white bg-white/80 p-5 shadow-sm">
            <h3 className="font-bold text-slate-900">Stay Organized</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Keep your questions and assignment details in one clean,
              structured document.
            </p>
          </div>

          <div className="rounded-2xl border border-white bg-white/80 p-5 shadow-sm">
            <h3 className="font-bold text-slate-900">Customize Easily</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Choose the details and document options that match your
              assignment requirements.
            </p>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about-us"
        className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/20 sm:p-8"
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-600">
            About Us
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
            About AssignCraft
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            AssignCraft is a student-focused assignment document generator
            designed to make assignment preparation faster and easier. It helps
            turn questions from PDF/DOCX files or copied text into a structured,
            customizable document ready for Word, PDF or Print.
          </p>
        </div>

        <div className="mx-auto mt-8 grid max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 md:grid-cols-2">
          {/* Developer */}
          <div className="flex items-center gap-4 border-b border-slate-200 p-5 md:border-b-0 md:border-r">
            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <img
                src="/manav-rabadiya.jpeg"
                alt="Manav Rabadiya"
                className="h-20 w-20 rounded-2xl border-2 border-white object-cover shadow-md transition hover:scale-105"
              />
            </a>

            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600">
                Developed By
              </p>

              <h3 className="mt-1 text-lg font-black text-slate-900">
                Manav Rabadiya
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                BCA Student & Frontend Developer
              </p>

              <a
                href={PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
              >
                View Portfolio ↗
              </a>
            </div>
          </div>

          {/* DEVLOKS */}
          <div className="flex items-center gap-4 p-5">
            <a
              href={DEVLOKS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 shadow-md transition hover:scale-105">
                <img
                  src="/devloks-favicon.png"
                  alt="DEVLOKS Logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </a>

            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">
                Presented By
              </p>

              <h3 className="mt-1 text-lg font-black text-slate-900">
                DEVLOKS
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Your Vision. Our Code. Real Results.
              </p>

              <a
                href={DEVLOKS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-700"
              >
                Visit DEVLOKS ↗
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
