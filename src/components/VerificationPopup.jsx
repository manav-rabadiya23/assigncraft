import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

// The reminder is shown every time the site is opened (page load / refresh),
// not only on the first visit. It is not shown again when moving between pages.
const OLD_STORAGE_KEY = "assigncraft-verification-popup-seen";

export default function VerificationPopup() {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    try {
      localStorage.removeItem(OLD_STORAGE_KEY); // from the previous "show once" version
    } catch {
      // storage can be blocked; nothing to clean up then
    }

    document.body.style.overflow = "hidden";

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        document.body.style.overflow = "";
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, []);

  const closePopup = () => {
    setIsOpen(false);
    document.body.style.overflow = "";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <div
        className="
          relative w-full max-w-md
          overflow-hidden rounded-2xl
          border border-slate-200
          bg-white
          shadow-2xl
        "
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closePopup}
          aria-label="Close"
          className="
            absolute right-4 top-4
            flex h-8 w-8 items-center justify-center
            rounded-full
            text-slate-400
            transition
            hover:bg-slate-100
            hover:text-slate-700
          "
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="px-6 pb-6 pt-7 sm:px-7">
          {/* Icon */}
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
            <AlertTriangle
              size={25}
              strokeWidth={2.2}
              className="text-amber-500"
            />
          </div>

          {/* Heading */}
          <h2 className="font-poppins text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Please Verify Your Assignment
          </h2>

          {/* Description */}
          <p className="mt-3 text-sm leading-6 text-slate-600">
            AssignCraft helps you quickly create assignments from your questions
            and documents. However, automated processing may sometimes make
            mistakes while reading, extracting, formatting, or generating
            content.
          </p>

          {/* Important Notice */}
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3.5">
            <p className="text-sm font-medium leading-5 text-slate-700">
              Please review all questions, answers, names, numbers, formatting,
              and other details carefully before downloading, printing, or
              submitting your assignment.
            </p>
          </div>

          {/* Footer Text */}
          <p className="mt-4 text-xs leading-5 text-slate-500">
            AssignCraft is a tool to assist you. Always verify the final
            document yourself.
          </p>

          {/* Button */}
          <button
            type="button"
            onClick={closePopup}
            className="
              mt-6 w-full
              rounded-xl
              bg-indigo-600
              px-5 py-3
              text-sm font-semibold text-white
              shadow-sm
              transition-all duration-200
              hover:bg-indigo-700
              hover:shadow-md
              active:scale-[0.98]
            "
          >
            Got it, Continue
          </button>
        </div>
      </div>
    </div>
  );
}
