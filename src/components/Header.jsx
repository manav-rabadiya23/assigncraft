import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaChevronDown,
  FaFileArrowUp,
  FaListCheck,
  FaSliders,
  FaEye,
  FaHouse,
  FaBars,
  FaXmark,
  FaWandMagicSparkles,
  FaArrowRightLong,
  FaCircleInfo,
  FaBolt,
  FaUserGroup,
} from "react-icons/fa6";

const featureItems = [
  {
    icon: FaFileArrowUp,
    title: "Question Input",
    description: "Multiple files, copy-paste and OCR",
    to: "/features#question-input",
  },
  {
    icon: FaListCheck,
    title: "Question Management",
    description: "Edit, delete and drag & drop",
    to: "/features#question-management",
  },
  {
    icon: FaSliders,
    title: "Customization",
    description: "Custom details and document options",
    to: "/features#customization",
  },
  {
    icon: FaEye,
    title: "Preview & Export",
    description: "Preview, Word, PDF and Print",
    to: "/features#export",
  },
];

export default function Header() {
  const [hoverOpen, setHoverOpen] = useState(false);
  const [clickedOpen, setClickedOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const featureRef = useRef(null);
  const featuresOpen = hoverOpen || clickedOpen;

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (featureRef.current && !featureRef.current.contains(event.target)) {
        setClickedOpen(false);
        setHoverOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const navClass = ({ isActive }) =>
    `rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
      isActive
        ? "bg-indigo-50 text-indigo-700 shadow-sm"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
    }`;

  return (
    <header className="relative z-50 border-t-[3px] border-violet-600 border-b border-slate-200/80 bg-white shadow-[0_3px_14px_rgba(15,23,42,0.05)]">
      {" "}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        {" "}
        {/* BRAND */}
        <NavLink to="/" className="group -ml-2 flex items-center">
          <p className="font-serif text-[17px] font-semibold italic tracking-wide text-slate-500 transition group-hover:text-indigo-600">
            From Questions to Document
          </p>
        </NavLink>
        {/* DESKTOP NAV */}
        <nav className="hidden items-center gap-1.5 md:flex">
          <NavLink to="/" end className={navClass}>
            <span className="inline-flex items-center gap-2">
              <FaHouse className="text-[12px]" />
              Home
            </span>
          </NavLink>

          <NavLink to="/how-it-works" className={navClass}>
            <span className="inline-flex items-center gap-2">
              <FaCircleInfo className="text-[12px]" />
              How It Works
            </span>
          </NavLink>

          <NavLink to="/why-assigncraft" className={navClass}>
            <span className="inline-flex items-center gap-2">
              <FaBolt className="text-[12px]" />
              Why AssignCraft
            </span>
          </NavLink>

          {/* FEATURES DROPDOWN */}
          <div
            ref={featureRef}
            className="relative"
            onMouseEnter={() => setHoverOpen(true)}
            onMouseLeave={() => setHoverOpen(false)}
          >
            <button
              type="button"
              onClick={() => setClickedOpen((current) => !current)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
                featuresOpen
                  ? "bg-indigo-50 text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <FaWandMagicSparkles className="text-[12px]" />
              Features
              <FaChevronDown
                className={`text-[10px] transition-transform duration-200 ${
                  featuresOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {featuresOpen && (
              <div className="absolute left-1/2 top-full z-50 w-[340px] -translate-x-1/2 pt-2.5">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2.5 shadow-[0_18px_55px_rgba(15,23,42,0.16)]">
                  <div className="px-2.5 pb-2.5 pt-1.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      AssignCraft Features
                    </p>
                  </div>

                  <div className="space-y-1">
                    {featureItems.map((feature) => {
                      const Icon = feature.icon;

                      return (
                        <NavLink
                          key={feature.title}
                          to={feature.to}
                          onClick={() => {
                            setClickedOpen(false);
                            setHoverOpen(false);
                          }}
                          className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition duration-150 hover:bg-indigo-50"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-indigo-600 transition group-hover:bg-white group-hover:shadow-sm">
                            <Icon className="text-[15px]" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">
                              {feature.title}
                            </p>
                            <p className="mt-0.5 text-xs leading-5 text-slate-500">
                              {feature.description}
                            </p>
                          </div>
                        </NavLink>
                      );
                    })}
                  </div>

                  <NavLink
                    to="/features"
                    onClick={() => {
                      setClickedOpen(false);
                      setHoverOpen(false);
                    }}
                    className="mt-2.5 flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
                  >
                    View All Features
                    <FaArrowRightLong className="text-[11px]" />
                  </NavLink>
                </div>
              </div>
            )}
          </div>

          <NavLink to="/about" className={navClass}>
            <span className="inline-flex items-center gap-2">
              <FaUserGroup className="text-[12px]" />
              About Us
            </span>
          </NavLink>
        </nav>
        {/* MOBILE BUTTON */}
        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm md:hidden"
          aria-label="Open navigation"
        >
          {mobileOpen ? <FaXmark /> : <FaBars />}
        </button>
      </div>
      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-3 md:hidden">
          <div className="space-y-1">
            <NavLink
              to="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-xl px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FaHouse className="text-sm" />
              Home
            </NavLink>

            <NavLink
              to="/how-it-works"
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              How It Works
            </NavLink>

            <NavLink
              to="/why-assigncraft"
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Why AssignCraft
            </NavLink>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setClickedOpen((current) => !current)}
                className="flex w-full items-center justify-between px-4 py-3 font-semibold text-slate-700"
              >
                Features
                <FaChevronDown
                  className={`text-xs transition-transform ${
                    clickedOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {clickedOpen && (
                <div className="space-y-1 border-t border-slate-200 p-2">
                  {featureItems.map((feature) => {
                    const Icon = feature.icon;

                    return (
                      <NavLink
                        key={feature.title}
                        to={feature.to}
                        onClick={() => {
                          setClickedOpen(false);
                          setMobileOpen(false);
                        }}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-indigo-50"
                      >
                        <Icon className="text-indigo-600" />
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {feature.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {feature.description}
                          </p>
                        </div>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>

            <NavLink
              to="/about"
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              About Us
            </NavLink>
          </div>
        </div>
      )}
    </header>
  );
}
