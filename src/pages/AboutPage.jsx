import {
  FaCode,
  FaExternalLinkAlt,
  FaGlobe,
  FaGraduationCap,
  FaInstagram,
  FaLightbulb,
  FaUser,
} from "react-icons/fa";

import Header from "../components/Header";
import SiteFooter from "../components/SiteFooter";
import { DEVLOKS_URL, PORTFOLIO_URL } from "../constants/defaults";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main>
        <section className="relative overflow-hidden bg-white">
          <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-100 blur-3xl" />

          <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:py-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-violet-700">
              <FaLightbulb />
              About Us
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Built to Make Assignment Preparation Easier
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              AssignCraft is a student-focused assignment document generator created to reduce repetitive formatting and help students prepare structured assignment files faster.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-7 text-white">
                <div className="flex items-center gap-4">
                  <img
                    src="/manav-rabadiya.jpeg"
                    alt="Manav Rabadiya"
                    className="h-24 w-24 rounded-3xl border-4 border-white/20 object-cover shadow-xl"
                  />

                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-indigo-200">
                      <FaUser />
                      Developed By
                    </div>
                    <h2 className="mt-2 text-2xl font-black">Manav Rabadiya</h2>
                    <p className="mt-1 text-sm text-indigo-100">
                      BCA Student • Frontend Developer
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-7">
                <p className="text-sm leading-7 text-slate-600">
                  AssignCraft was developed as a student-focused tool to simplify the repeated work involved in preparing assignment documents from teacher-provided questions.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700">
                    <FaGraduationCap />
                    BCA Student
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                    <FaCode />
                    Web Development
                  </span>
                </div>

                <a
                  href={PORTFOLIO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
                >
                  View Portfolio
                  <FaExternalLinkAlt className="text-xs" />
                </a>
              </div>
            </article>

            <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="bg-slate-950 p-7 text-white">
                <div className="flex items-center gap-4">
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white p-4 shadow-xl">
                    <img
                      src="/devloks-favicon.png"
                      alt="DEVLOKS Logo"
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                      Presented By
                    </div>
                    <h2 className="mt-2 text-2xl font-black">DEVLOKS</h2>
                    <p className="mt-1 text-sm text-slate-300">
                      Your Vision. Our Code. Real Results.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-7">
                <p className="text-sm leading-7 text-slate-600">
                  DEVLOKS represents the development and presentation side of AssignCraft, focused on building practical digital products and student-oriented solutions.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700">
                    <FaGlobe />
                    Digital Products
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                    <FaInstagram />
                    DEVLOKS
                  </span>
                </div>

                <a
                  href={DEVLOKS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-700"
                >
                  Visit DEVLOKS
                  <FaExternalLinkAlt className="text-xs" />
                </a>
              </div>
            </article>
          </div>

          <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.4fr_0.6fr]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                  The Purpose
                </p>
                <h2 className="mt-3 text-2xl font-black">
                  Why AssignCraft was created
                </h2>
              </div>

              <div className="space-y-4 text-sm leading-7 text-slate-600">
                <p>
                  Students often receive assignment questions in PDFs or Word files and then spend additional time copying those questions into a properly formatted document.
                </p>
                <p>
                  AssignCraft reduces that repeated work by helping users import questions, organize them, add assignment details, choose document settings and generate a ready Word or PDF file.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
