import { useEffect, useMemo, useRef, useState } from "react";
import { FaEnvelope, FaPhoneAlt, FaWhatsapp } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import {
  CONTACT_EMAIL,
  CONTACT_TOPICS,
  CONTACT_WHATSAPP,
  OWNER_PHONE_DISPLAY,
  OWNER_PHONE_LINK,
} from "../constants/contact";
import { focusAndHighlight } from "../utils/focusTarget";
import { buildEmailBody, buildWhatsAppText } from "../utils/contactMessage";
import { openLink } from "../utils/openLink";

const inputClass =
  "h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isValidMobile(value) {
  const digits = value.replace(/\D/g, "");
  return (
    /^[+\d\s\-()]+$/.test(value) && digits.length >= 7 && digits.length <= 15
  );
}

function describeReport(report) {
  if (!report?.files?.length) return "";

  return report.files
    .map((file, index) => {
      const parts = [
        `File ${index + 1}: .${file.type}`,
        `${file.questions} question(s) found`,
        file.confidence !== undefined ? `confidence ${file.confidence}%` : "",
        file.style ? `numbering style: ${file.style}` : "",
        file.usedOcr ? "read with OCR" : "",
        file.error ? `error: ${file.error}` : "",
        file.warnings?.length ? `warnings: ${file.warnings.join(" ")}` : "",
      ];
      return parts.filter(Boolean).join(" | ");
    })
    .join("\n");
}

function technicalInfo() {
  return [
    `Page: ${window.location.pathname}`,
    `Screen: ${window.screen.width}x${window.screen.height}`,
    navigator.userAgent.slice(0, 90),
  ].join("\n");
}

function Field({ id, label, required, error, hint, className = "", children }) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-semibold text-slate-700"
      >
        {label}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-xs font-semibold text-red-600"
        >
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

function ContactLine({ icon, label, value, href }) {
  const content = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-lg">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-bold uppercase tracking-wider text-indigo-200">
          {label}
        </span>
        <span className="block break-words text-sm font-semibold text-white">
          {value}
        </span>
      </span>
    </>
  );

  return (
    <li>
      {href ? (
        <a
          href={href}
          className="flex items-center gap-3 rounded-xl p-1 transition hover:bg-white/10"
        >
          {content}
        </a>
      ) : (
        <div className="flex items-center gap-3 p-1">{content}</div>
      )}
    </li>
  );
}

export default function ContactSection() {
  const location = useLocation();
  const report = location.state?.report || null;
  const sectionRef = useRef(null);

  const [form, setForm] = useState({
    topic: report ? "format" : "bug",
    name: "",
    mobile: "",
    email: "",
    message: "",
    includeTech: true,
    includeSnippet: false,
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: "idle", text: "" });
  const [pendingMessage, setPendingMessage] = useState("");

  const reportSummary = useMemo(() => describeReport(report), [report]);

  // Arriving from "Report this file format" or a #contact link: scroll here.
  useEffect(() => {
    if (location.hash === "#contact" || report) {
      const timer = window.setTimeout(
        () =>
          sectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        120,
      );
      return () => window.clearTimeout(timer);
    }
  }, [location.hash, report]);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = "Please enter your name.";
    if (!form.mobile.trim()) next.mobile = "Please enter your mobile number.";
    else if (!isValidMobile(form.mobile.trim())) {
      next.mobile = "Enter a valid number, for example +91 98765 43210.";
    }
    if (!form.email.trim()) next.email = "Please enter your email address.";
    else if (!EMAIL_PATTERN.test(form.email.trim())) {
      next.email = "Please enter a valid email address.";
    }
    if (form.message.trim().length < 10) {
      next.message =
        "Please describe the problem in a few words (at least 10 characters).";
    }
    return next;
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(pendingMessage);
      setStatus({
        state: "info",
        text: "Message copied. You can paste it anywhere.",
      });
    } catch {
      setStatus({
        state: "error",
        text: "Could not copy. Please select the text and copy it.",
      });
    }
  };

  const send = (channel) => {
    const found = validate();
    setErrors(found);

    const firstError = ["name", "mobile", "email", "message"].find(
      (field) => found[field],
    );
    if (firstError) {
      setStatus({ state: "error", text: found[firstError] });
      focusAndHighlight(`contact-${firstError}`);
      return;
    }

    const topicLabel =
      CONTACT_TOPICS.find((item) => item.value === form.topic)?.label ||
      form.topic;
    const fields = {
      name: form.name.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim(),
      topicLabel,
      message: form.message.trim(),
      report: reportSummary,
      snippet: form.includeSnippet ? report?.snippet : "",
      tech: form.includeTech ? technicalInfo() : "",
    };

    if (channel === "whatsapp") {
      const text = buildWhatsAppText(fields);
      setPendingMessage(text);

      if (!CONTACT_WHATSAPP) {
        console.warn(
          "Contact form: set OWNER_WHATSAPP in src/constants/contact.js.",
        );
        setStatus({
          state: "error",
          text: "WhatsApp is not available right now. Please use Email, or copy your message below.",
        });
        return;
      }

      openLink(
        `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(text)}`,
        { newTab: true },
      );
      setStatus({
        state: "info",
        text: "WhatsApp is opening with your message ready. Just press Send there. If nothing opened, copy the message below.",
      });
      return;
    }

    const body = buildEmailBody(fields);
    setPendingMessage(body);

    if (!CONTACT_EMAIL) {
      console.warn(
        "Contact form: set OWNER_EMAIL in src/constants/contact.js.",
      );
      setStatus({
        state: "error",
        text: "Email is not available right now. Please use WhatsApp, or copy your message below.",
      });
      return;
    }

    openLink(
      `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`AssignCraft: ${topicLabel}`)}&body=${encodeURIComponent(body)}`,
    );
    setStatus({
      state: "info",
      text: "Your email app is opening with the message ready. Just press Send there. If nothing opened, copy the message below.",
    });
  };

  const statusStyle = {
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  }[status.state];

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="bg-slate-50 px-4 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-black uppercase tracking-widest text-indigo-600">
            Contact
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
            Facing a problem?
          </h2>
          <p className="mt-3 text-slate-600">
            Tell me what went wrong, a file that was not read correctly, or an
            idea you would like to see. I read every message and will reply.
          </p>
        </header>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-300/30 lg:grid lg:grid-cols-[340px_1fr]">
          <aside className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white sm:p-10">
            <h3 className="text-xl font-black">Contact details</h3>
            <p className="mt-2 text-sm leading-6 text-indigo-100">
              Write your message and choose how to send it. Your email app or
              WhatsApp opens with everything already written, you only press
              Send.
            </p>

            <ul className="mt-8 space-y-3">
              <ContactLine
                icon={<FaPhoneAlt />}
                label="Phone"
                value={OWNER_PHONE_DISPLAY}
                href={OWNER_PHONE_LINK}
              />
              {CONTACT_WHATSAPP && (
                <ContactLine
                  icon={<FaWhatsapp />}
                  label="WhatsApp"
                  value={`+${CONTACT_WHATSAPP}`}
                  href={`https://wa.me/${CONTACT_WHATSAPP}`}
                />
              )}
              {CONTACT_EMAIL && (
                <ContactLine
                  icon={<FaEnvelope />}
                  label="Email"
                  value={CONTACT_EMAIL}
                  href={`mailto:${CONTACT_EMAIL}`}
                />
              )}
            </ul>

            <p className="mt-8 rounded-2xl bg-white/10 p-4 text-xs leading-5 text-indigo-100">
              Tip: for a file that was read wrongly, choose “A file or format is
              not read correctly” so its details are attached.
            </p>
          </aside>

          <form
            onSubmit={(event) => event.preventDefault()}
            noValidate
            className="p-6 sm:p-10"
          >
            {report && (
              <div className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
                <p className="font-bold">Details of your file are attached</p>
                <pre className="mt-2 whitespace-pre-wrap font-mono text-xs">
                  {reportSummary}
                </pre>
                {report.snippet && (
                  <label className="mt-3 flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={form.includeSnippet}
                      onChange={(event) =>
                        update("includeSnippet", event.target.checked)
                      }
                      className="mt-0.5 h-4 w-4 accent-indigo-600"
                    />
                    <span>
                      Also send the first lines of the file&apos;s text, so I
                      can see its layout. (Leave this off if the file has
                      private information.)
                    </span>
                  </label>
                )}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="contact-topic"
                label="What is it about?"
                required
                className="sm:col-span-2"
              >
                <div className="relative">
                  <select
                    id="contact-topic"
                    value={form.topic}
                    onChange={(event) => update("topic", event.target.value)}
                    className={`${inputClass} appearance-none pr-11`}
                  >
                    {CONTACT_TOPICS.map((topic) => (
                      <option key={topic.value} value={topic.value}>
                        {topic.label}
                      </option>
                    ))}
                  </select>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 8l5 5 5-5" />
                  </svg>
                </div>
              </Field>

              <Field
                id="contact-name"
                label="Your name"
                required
                error={errors.name}
              >
                <input
                  id="contact-name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={
                    errors.name ? "contact-name-error" : undefined
                  }
                  className={`${inputClass} ${errors.name ? "border-red-400" : ""}`}
                  placeholder="Full name"
                  maxLength={80}
                />
              </Field>

              <Field
                id="contact-mobile"
                label="Mobile number"
                required
                error={errors.mobile}
                hint="With country code, e.g. +91 98765 43210"
              >
                <input
                  id="contact-mobile"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.mobile}
                  onChange={(event) => update("mobile", event.target.value)}
                  aria-invalid={Boolean(errors.mobile)}
                  aria-describedby={
                    errors.mobile ? "contact-mobile-error" : undefined
                  }
                  className={`${inputClass} ${errors.mobile ? "border-red-400" : ""}`}
                  placeholder="+91 98765 43210"
                  maxLength={20}
                />
              </Field>

              <Field
                id="contact-email"
                label="Email address"
                required
                error={errors.email}
                className="sm:col-span-2"
              >
                <input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={
                    errors.email ? "contact-email-error" : undefined
                  }
                  className={`${inputClass} ${errors.email ? "border-red-400" : ""}`}
                  placeholder="you@example.com"
                  maxLength={120}
                />
              </Field>

              <Field
                id="contact-message"
                label="Describe the problem"
                required
                error={errors.message}
                hint={`Please do not include passwords. ${form.message.length}/2000`}
                className="sm:col-span-2"
              >
                <textarea
                  id="contact-message"
                  rows={6}
                  value={form.message}
                  onChange={(event) => update("message", event.target.value)}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={
                    errors.message ? "contact-message-error" : undefined
                  }
                  placeholder="What did you do, what did you expect, and what happened instead?"
                  className={`${inputClass} h-auto resize-y py-3 leading-6 ${errors.message ? "border-red-400" : ""}`}
                  maxLength={2000}
                />
              </Field>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.includeTech}
                onChange={(event) =>
                  update("includeTech", event.target.checked)
                }
                className="mt-0.5 h-4 w-4 accent-indigo-600"
              />
              <span>
                Include technical details (browser, screen size, page) to help
                me find the problem.
              </span>
            </label>

            <div aria-live="polite">
              {status.text && (
                <p
                  className={`mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${statusStyle}`}
                >
                  {status.text}
                </p>
              )}
            </div>

            {pendingMessage && (
              <div className="mt-4 space-y-2">
                <textarea
                  readOnly
                  value={pendingMessage}
                  rows={6}
                  aria-label="Your message"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 font-mono text-xs text-slate-700 outline-none"
                />
                <button
                  type="button"
                  onClick={copyMessage}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
                >
                  Copy message
                </button>
              </div>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => send("email")}
                className="flex h-14 items-center justify-center gap-3 rounded-xl bg-indigo-600 px-6 text-base font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300"
              >
                <FaEnvelope aria-hidden="true" />
                Send to Email
              </button>
              <button
                type="button"
                onClick={() => send("whatsapp")}
                className="flex h-14 items-center justify-center gap-3 rounded-xl bg-emerald-600 px-6 text-base font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
              >
                <FaWhatsapp aria-hidden="true" className="text-xl" />
                Send to WhatsApp
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-slate-500">
              Each button opens your email app or WhatsApp with the message
              already written. You only need to press Send there. Your mobile
              number and email will be visible to me so I can reply.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
