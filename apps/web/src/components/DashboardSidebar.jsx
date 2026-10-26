import { Link } from "react-router-dom";

export function DashboardSidebar({ title, user, tabs, activeTab, onSelect, backHref, backLabel = "Back to dashboard" }) {
    return (
        <aside className="z-40 w-full border-b border-slate-200 bg-white/95 px-3 py-3 shadow-sm backdrop-blur lg:fixed lg:inset-y-16 lg:left-0 lg:w-64 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-4 lg:py-6 lg:shadow-none">
            <div className="mb-4 flex items-center justify-between gap-3 px-2 lg:mb-7">
                <div className="min-w-0">
                    <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">LearnHUB</p>
                    <h2 className="mt-1 truncate text-sm font-bold text-slate-900">{title}</h2>
                </div>
                {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-slate-100"/>
                ) : (
                    <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg">👤</span>
                )}
            </div>
            <nav aria-label={`${title} navigation`} className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        aria-current={activeTab === tab.id ? "page" : undefined}
                        onClick={() => onSelect(tab.id)}
                        className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition lg:w-full ${
                            activeTab === tab.id
                                ? "bg-emerald-800 text-white shadow-sm"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                        }`}
                    >
                        <span className="text-base" aria-hidden="true">{tab.icon}</span>
                        <span className="whitespace-nowrap lg:whitespace-normal">{tab.label}</span>
                    </button>
                ))}
            </nav>
            {backHref ? (
                <Link to={backHref} className="mt-5 hidden rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 lg:block">
                    ← {backLabel}
                </Link>
            ) : null}
            <div className="mt-6 hidden border-t border-slate-100 px-2 pt-4 lg:block">
                <p className="truncate text-xs font-bold text-slate-800">{user?.fullName || user?.name || ""}</p>
                <p className="mt-1 truncate text-[11px] text-slate-500">{user?.email || ""}</p>
            </div>
        </aside>
    );
}
