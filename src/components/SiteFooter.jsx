import { DEVLOKS_URL, PORTFOLIO_URL } from "../constants/defaults";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
          <div className="grid md:grid-cols-2">
            <div className="flex items-center gap-4 border-b border-slate-200 p-4 md:border-b-0 md:border-r">
              <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer" className="shrink-0">
                <img src="/manav-rabadiya.jpeg" alt="Manav Rabadiya" className="h-16 w-16 rounded-xl border-2 border-white object-cover shadow-md" />
              </a>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Developed By</p>
                <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer" className="mt-0.5 block text-base font-bold text-slate-900 hover:text-indigo-600">Manav Rabadiya</a>
                <p className="mt-1 text-xs leading-5 text-slate-500">BCA Student and Frontend Developer</p>
                <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">View Portfolio ↗</a>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4">
              <a href={DEVLOKS_URL} target="_blank" rel="noopener noreferrer" className="shrink-0">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-md">
                  <img src="/devloks-favicon.png" alt="DEVLOKS Logo" className="h-full w-full object-contain" />
                </div>
              </a>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">Presented By</p>
                <a href={DEVLOKS_URL} target="_blank" rel="noopener noreferrer" className="mt-0.5 block text-base font-bold text-slate-900 hover:text-violet-600">DEVLOKS</a>
                <p className="mt-1 text-xs leading-5 text-slate-500">Modern websites and digital solutions</p>
                <a href={DEVLOKS_URL} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700">Visit DEVLOKS ↗</a>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] leading-5 text-slate-500">© {new Date().getFullYear()} AssignCraft · Developed by Manav Rabadiya · Presented by DEVLOKS</p>
      </div>
    </footer>
  );
}
