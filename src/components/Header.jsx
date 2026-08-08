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
  const [desktopHoverOpen, setDesktopHoverOpen] = useState(false);
  const [desktopClickOpen, setDesktopClickOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileFeaturesOpen, setMobileFeaturesOpen] = useState(false);

  const desktopFeatureRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const desktopFeaturesOpen = desktopHoverOpen || desktopClickOpen;

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        desktopFeatureRef.current &&
        !desktopFeatureRef.current.contains(event.target)
      ) {
        setDesktopClickOpen(false);
        setDesktopHoverOpen(false);
      }

      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setMobileOpen(false);
        setMobileFeaturesOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const closeMobileMenu = () => {
    setMobileOpen(false);
    setMobileFeaturesOpen(false);
  };

  const navClass = ({ isActive }) =>
    `rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
      isActive
        ? "bg-indigo-50 text-indigo-700 shadow-sm"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
    }`;

  const mobileNavClass = ({ isActive }) =>
    `flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
      isActive
        ? "bg-indigo-50 text-indigo-700"
        : "text-slate-700 hover:bg-slate-50"
    }`;

  return (
    <header className="relative z-50 border-t-[3px] border-violet-600 border-b border-slate-200/80 bg-white shadow-[0_3px_14px_rgba(15,23,42,0.05)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
        <NavLink to="/" className="group min-w-0" onClick={closeMobileMenu}>
          <p className="truncate font-serif text-[14px] font-semibold italic tracking-wide text-slate-500 transition group-hover:text-indigo-600 sm:text-[17px]">
            From Questions to Document
          </p>
        </NavLink>

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

          <div
            ref={desktopFeatureRef}
            className="relative"
            onMouseEnter={() => setDesktopHoverOpen(true)}
            onMouseLeave={() => setDesktopHoverOpen(false)}
          >
            <button
              type="button"
              onClick={() => setDesktopClickOpen((current) => !current)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
                desktopFeaturesOpen
                  ? "bg-indigo-50 text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <FaWandMagicSparkles className="text-[12px]" />
              Features
              <FaChevronDown
                className={`text-[10px] transition-transform duration-200 ${
                  desktopFeaturesOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {desktopFeaturesOpen && (
              <div className="absolute left-1/2 top-full z-[100] w-[340px] -translate-x-1/2 pt-2.5">
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
                            setDesktopClickOpen(false);
                            setDesktopHoverOpen(false);
                          }}
                          className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition hover:bg-indigo-50"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-indigo-600">
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
                      setDesktopClickOpen(false);
                      setDesktopHoverOpen(false);
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

          <NavLink to="/continue-assignment" className={navClass}>
            <span className="inline-flex items-center gap-2">
              <FaFileArrowUp className="text-[12px]" />
              Merge Assignment
            </span>
          </NavLink>

          <NavLink to="/jupyter-tools" className={navClass}>
            <span className="inline-flex items-center gap-2">
              <FaListCheck className="text-[12px]" />
              Jupyter Tools
            </span>
          </NavLink>

          <NavLink to="/about" className={navClass}>
            <span className="inline-flex items-center gap-2">
              <FaUserGroup className="text-[12px]" />
              About Us
            </span>
          </NavLink>
        </nav>

        <div ref={mobileMenuRef} className="relative md:hidden">
          <button
            type="button"
            onClick={() => {
              setMobileOpen((current) => !current);
              if (mobileOpen) setMobileFeaturesOpen(false);
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition active:scale-95"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          >
            {mobileOpen ? <FaXmark /> : <FaBars />}
          </button>

          {mobileOpen && (
            <div className="absolute right-0 top-[calc(100%+12px)] z-[200] w-[min(330px,calc(100vw-24px))] max-h-[calc(100vh-90px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2.5 shadow-[0_20px_60px_rgba(15,23,42,0.20)]">
              <NavLink to="/" end onClick={closeMobileMenu} className={mobileNavClass}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FaHouse />
                </div>
                Home
              </NavLink>

              <NavLink to="/how-it-works" onClick={closeMobileMenu} className={mobileNavClass}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FaCircleInfo />
                </div>
                How It Works
              </NavLink>

              <NavLink to="/why-assigncraft" onClick={closeMobileMenu} className={mobileNavClass}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FaBolt />
                </div>
                Why AssignCraft
              </NavLink>

              <div className="mt-1">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setMobileFeaturesOpen((current) => !current);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    mobileFeaturesOpen
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <FaWandMagicSparkles />
                    </span>
                    Features
                  </span>
                  <FaChevronDown
                    className={`mr-1 text-xs transition-transform duration-200 ${
                      mobileFeaturesOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {mobileFeaturesOpen && (
                  <div className="ml-5 mt-2 space-y-1 border-l-2 border-indigo-100 pl-3">
                    {featureItems.map((feature) => {
                      const Icon = feature.icon;
                      return (
                        <NavLink
                          key={feature.title}
                          to={feature.to}
                          onClick={closeMobileMenu}
                          className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-indigo-50"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-sm text-violet-600">
                            <Icon />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800">
                              {feature.title}
                            </p>
                            <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                              {feature.description}
                            </p>
                          </div>
                        </NavLink>
                      );
                    })}

                    <NavLink
                      to="/features"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50"
                    >
                      View All Features
                      <FaArrowRightLong className="text-[10px]" />
                    </NavLink>
                  </div>
                )}
              </div>

              <NavLink
                to="/continue-assignment"
                onClick={closeMobileMenu}
                className={mobileNavClass}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FaFileArrowUp />
                </div>
                Merge Assignment
              </NavLink>

              <NavLink
                to="/jupyter-tools"
                onClick={closeMobileMenu}
                className={mobileNavClass}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FaListCheck />
                </div>
                Jupyter Tools
              </NavLink>

              <NavLink to="/about" onClick={closeMobileMenu} className={mobileNavClass}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FaUserGroup />
                </div>
                About Us
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
