import React from "react";
export function SectionHeading({ title, subtitle, badge, centered = false, }) {
    return (<div className={`mb-10 ${centered ? "text-center max-w-3xl mx-auto" : ""}`}>
      {badge ? (<div className="public-heading-badge inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-bold mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true"></span>
          <span>{badge}</span>
        </div>) : null}
      <h2 className="public-heading text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-tight">
        {title}
      </h2>
      {subtitle ? (<p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
          {subtitle}
        </p>) : null}
    </div>);
}
export function MetricCard({ label, value, subtext, icon, trend, }) {
    return (<div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/90 hover:shadow-lg hover:ring-blue-500/40 transition-all duration-300">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
        {icon ? (<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-xl group-hover:scale-110 group-hover:bg-blue-50 transition-all">
            {icon}
          </div>) : null}
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <p className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">{value}</p>
        {trend ? (<span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
            {trend}
          </span>) : null}
      </div>
      {subtext ? <p className="mt-2 text-xs text-slate-500 font-medium">{subtext}</p> : null}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>);
}
export function DashboardCard({ title, subtitle, action, children, }) {
    return (<div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/90 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-4.5">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-500 font-medium">{subtitle}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      <div className="p-6">{children}</div>
    </div>);
}
export function EmptyState({ title = "No records found", description = "There are currently no items to display in this section.", }) {
    return (<div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 py-12 px-4 text-center bg-slate-50/40">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 text-slate-400 text-2xl">
        📁
      </div>
      <p className="mt-4 text-sm font-bold text-slate-800">{title}</p>
      <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">{description}</p>
    </div>);
}
export function Badge({ variant = "slate", children, }) {
    const styles = {
        emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
        amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
        rose: "bg-rose-50 text-rose-700 ring-rose-600/20",
        cyan: "bg-cyan-50 text-cyan-700 ring-cyan-600/20",
        indigo: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
        blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
        slate: "bg-slate-100 text-slate-700 ring-slate-500/10",
    };
    return (<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${styles[variant]}`}>
      {children}
    </span>);
}
export function Modal({ title, isOpen, onClose, children, }) {
    if (!isOpen)
        return null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors" type="button">
            ✕
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>);
}
