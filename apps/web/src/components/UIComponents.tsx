import React from "react";

export function SectionHeading({
  title,
  subtitle,
  centered = false,
}: {
  title: string;
  subtitle?: string;
  centered?: boolean;
}) {
  return (
    <div className={`mb-8 ${centered ? "text-center max-w-3xl mx-auto" : ""}`}>
      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{title}</h2>
      {subtitle ? <p className="mt-2 text-base text-slate-600">{subtitle}</p> : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  subtext,
  icon,
}: {
  label: string;
  value: number | string;
  subtext?: string;
  icon?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon ? <span className="text-xl">{icon}</span> : null}
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
      {subtext ? <p className="mt-1 text-xs text-slate-500">{subtext}</p> : null}
    </div>
  );
}

export function DashboardCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export function EmptyState({
  title = "ምንም መረጃ የለም / No records",
  description = "እስካሁን ምንም የተመዘገበ ነገር የለም።",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        📄
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-xs text-slate-500 max-w-sm">{description}</p>
    </div>
  );
}

export function Badge({
  variant = "slate",
  children,
}: {
  variant?: "emerald" | "amber" | "rose" | "cyan" | "slate" | "indigo" | "blue";
  children: React.ReactNode;
}) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
    rose: "bg-rose-50 text-rose-700 ring-rose-600/20",
    cyan: "bg-cyan-50 text-cyan-700 ring-cyan-600/20",
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
    blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
    slate: "bg-slate-100 text-slate-700 ring-slate-500/10",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

export function Modal({
  title,
  isOpen,
  onClose,
  children,
}: {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
