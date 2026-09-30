import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";

import {
  FaFileArrowUp,
  FaListCheck,
  FaHouse,
  FaBars,
  FaXmark,
  FaWandMagicSparkles,
  FaCircleInfo,
  FaBolt,
  FaUserGroup,
} from "react-icons/fa6";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  const navClass = ({ isActive }) =>
    `whitespace-nowrap rounded-xl px-2.5 py-2 text-[13px] font-semibold transition-all duration-200 xl:px-3 xl:text-sm ${
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
    <header className="sticky top-0 z-50 border-t-[3px] border-violet-600 border-b border-slate-200/80 bg-white shadow-[0_3px_14px_rgba(15,23,42,0.05)]">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-4 py-2.5 sm:px-6 xl:px-8">
        {/* Logo + Brand */}
        <NavLink
          to="/"
          className="group flex min-w-0 shrink-0 items-center gap-2"
          onClick={closeMobileMenu}
        >
          {/* Logo */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full sm:h-12 sm:w-12">
            <img
              src="/assigncraft-logo.png"
              alt="AssignCraft"
              className="h-full w-full object-cover"
            />
          </div>

          {/* Brand */}
          <div className="min-w-0">
            <p className="whitespace-nowrap font-poppins text-[17px] font-bold tracking-[-0.3px] sm:text-[21px]">
              <span className="text-slate-900">Assign</span>
              <span className="text-indigo-600">Craft</span>
            </p>

            <p className="whitespace-nowrap text-[9px] font-semibold italic tracking-wide text-slate-500 sm:text-xs">
              From Questions to Document
            </p>
          </div>
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="hidden min-w-0 items-center gap-0.5 lg:flex xl:gap-1">
          {/* Home */}
          <NavLink to="/" end className={navClass}>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap xl:gap-2">
              <FaHouse className="text-[12px]" />
              Home
            </span>
          </NavLink>

          {/* How It Works */}
          <NavLink to="/how-it-works" className={navClass}>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap xl:gap-2">
              <FaCircleInfo className="text-[12px]" />
              How It Works
            </span>
          </NavLink>

          {/* Why AssignCraft */}
          <NavLink to="/why-assigncraft" className={navClass}>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap xl:gap-2">
              <FaBolt className="text-[12px]" />
              Why AssignCraft
            </span>
          </NavLink>

          {/* Features - Direct Link */}
          <NavLink to="/features" className={navClass}>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap xl:gap-2">
              <FaWandMagicSparkles className="text-[12px]" />
              Features
            </span>
          </NavLink>

          {/* Merge Assignment */}
          <NavLink to="/continue-assignment" className={navClass}>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap xl:gap-2">
              <FaFileArrowUp className="text-[12px]" />
              Merge Assignment
            </span>
          </NavLink>

          {/* Jupyter Tools */}
          <NavLink to="/jupyter-tools" className={navClass}>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap xl:gap-2">
              <FaListCheck className="text-[12px]" />
              Jupyter Tools
            </span>
          </NavLink>

          {/* About Us */}
          <NavLink to="/about" className={navClass}>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap xl:gap-2">
              <FaUserGroup className="text-[12px]" />
              About Us
            </span>
          </NavLink>
        </nav>

        {/* Mobile Menu */}
        <div ref={mobileMenuRef} className="relative lg:hidden">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition active:scale-95"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          >
            {mobileOpen ? <FaXmark /> : <FaBars />}
          </button>

          {/* Mobile Navigation Panel */}
          {mobileOpen && (
            <div className="absolute right-0 top-[calc(100%+12px)] z-[200] w-[min(330px,calc(100vw-24px))] max-h-[calc(100vh-90px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2.5 shadow-[0_20px_60px_rgba(15,23,42,0.20)]">
              {/* Home */}
              <NavLink
                to="/"
                end
                onClick={closeMobileMenu}
                className={mobileNavClass}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FaHouse />
                </div>
                Home
              </NavLink>

              {/* How It Works */}
              <NavLink
                to="/how-it-works"
                onClick={closeMobileMenu}
                className={mobileNavClass}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FaCircleInfo />
                </div>
                How It Works
              </NavLink>

              {/* Why AssignCraft */}
              <NavLink
                to="/why-assigncraft"
                onClick={closeMobileMenu}
                className={mobileNavClass}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FaBolt />
                </div>
                Why AssignCraft
              </NavLink>

              {/* Features - Direct Link */}
              <NavLink
                to="/features"
                onClick={closeMobileMenu}
                className={mobileNavClass}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FaWandMagicSparkles />
                </div>
                Features
              </NavLink>

              {/* Merge Assignment */}
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

              {/* Jupyter Tools */}
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

              {/* About Us */}
              <NavLink
                to="/about"
                onClick={closeMobileMenu}
                className={mobileNavClass}
              >
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
