import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";

export function VerifyCertificatePage() {
    const { certificateNumber } = useParams();
    const [query, setQuery] = useState(certificateNumber || "");
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const lookupCertificate = async (num) => {
        if (!num || !num.trim()) return;
        setLoading(true);
        setError("");
        setCertificate(null);
        try {
            const res = await apiRequest(`/api/public/certificates/${encodeURIComponent(num.trim())}`);
            setCertificate(res.certificate);
        } catch (err) {
            setError(err.message || "Certificate record could not be verified.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (certificateNumber) {
            lookupCertificate(certificateNumber);
        }
    }, [certificateNumber]);

    const handleSearch = (e) => {
        e.preventDefault();
        lookupCertificate(query);
    };

    return (
        <div className="editorial-page min-h-screen pb-24">
            {/* Header Hero */}
            <div className="editorial-hero border-b border-stone-200/80 px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                    <span className="editorial-kicker text-emerald-800">
                        OFFICIAL CREDENTIAL VERIFICATION
                    </span>
                    <h1 className="editorial-display mt-3 text-4xl font-extrabold text-stone-900 sm:text-5xl">
                        Verify a LearnHUB Certificate
                    </h1>
                    <p className="mx-auto mt-3 max-w-2xl text-sm text-stone-600 sm:text-base">
                        Institutions, employers, and academic bodies can independently authenticate LearnHUB certificates issued to students upon completing verified courses.
                    </p>

                    {/* Lookup Input Form */}
                    <div className="mt-8 max-w-md mx-auto">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Enter ID e.g. LH-2026-XXXX"
                                className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-mono tracking-wider text-stone-900 shadow-sm outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
                            />
                            <button
                                type="submit"
                                disabled={loading || !query.trim()}
                                className="rounded-2xl bg-emerald-800 px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-emerald-900 disabled:opacity-50"
                            >
                                {loading ? "Checking…" : "Verify"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Verification Result Section */}
            <div className="mx-auto max-w-4xl px-4 pt-12 sm:px-6 lg:px-8">
                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="flex items-center gap-3 rounded-2xl bg-white p-6 ring-1 ring-stone-200 shadow-sm">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-800 border-t-transparent"></div>
                            <span className="text-xs font-bold text-stone-700">Verifying credential against registry…</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="rounded-3xl bg-rose-50 p-8 text-center ring-1 ring-rose-200">
                        <span className="text-3xl mb-2 block">⚠️</span>
                        <h3 className="font-bold text-rose-900 text-lg">Verification Failed</h3>
                        <p className="mt-1 text-xs text-rose-700">{error}</p>
                        <p className="mt-3 text-[11px] text-stone-500">
                            Please verify that the certificate identifier was typed correctly with prefixes (e.g. LH-2026-...).
                        </p>
                    </div>
                )}

                {certificate && (
                    <div className="space-y-6">
                        {/* Status Alert Badge */}
                        <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-6 py-3.5 ring-1 ring-emerald-200">
                            <div className="flex items-center gap-3">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-white font-bold text-xs">
                                    ✓
                                </span>
                                <span className="text-xs font-bold text-emerald-900">
                                    Official Authenticated Credential — Active & Valid
                                </span>
                            </div>
                            <button
                                onClick={() => window.print()}
                                className="rounded-xl border border-emerald-300 bg-white px-3 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-50"
                            >
                                🖨️ Print / Save
                            </button>
                        </div>

                        {/* Framed Certificate Presentation */}
                        <div className="relative overflow-hidden rounded-3xl border-8 border-stone-800 bg-[#fffef9] p-8 sm:p-14 shadow-2xl text-center">
                            {/* Inner Decorative Border */}
                            <div className="rounded-2xl border border-amber-600/30 p-8 sm:p-12 relative bg-radial-gradient">
                                {/* Watermark Brand Seal */}
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#285b45] text-xl font-black text-[#e7d5ad] shadow-lg mb-6 ring-2 ring-amber-500/30">
                                    LH
                                </div>

                                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-900">
                                    LEARNHUB ONLINE LEARNING PLATFORM
                                </p>
                                <h2 className="editorial-display mt-2 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                                    Certificate of Course Completion
                                </h2>

                                <p className="mt-6 text-xs text-stone-500 uppercase tracking-widest">
                                    THIS IS PROUDLY CONFERRED UPON
                                </p>
                                <div className="editorial-display mt-2 text-3xl font-extrabold text-stone-950 sm:text-4xl underline decoration-amber-400 decoration-2 underline-offset-8">
                                    {certificate.studentName}
                                </div>

                                <p className="mt-6 text-xs text-stone-600 max-w-xl mx-auto leading-relaxed">
                                    for successfully satisfying all academic requirements, attending scheduled cohort live sessions,
                                    completing coursework assignments, and passing evaluation assessments in
                                </p>

                                <div className="mt-3 text-xl font-black text-emerald-900 sm:text-2xl">
                                    {certificate.courseTitle}
                                </div>

                                <div className="mt-8 flex flex-wrap items-center justify-around gap-6 border-t border-stone-200/80 pt-8 text-left text-xs">
                                    <div>
                                        <span className="block text-[10px] uppercase font-bold text-stone-400">Date Issued</span>
                                        <span className="font-bold text-stone-800">
                                            {new Date(certificate.issueDate).toLocaleDateString(undefined, { dateStyle: "long" })}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] uppercase font-bold text-stone-400">Overall Score</span>
                                        <span className="font-mono font-bold text-emerald-800 text-sm">
                                            {certificate.overallScore}% Grade
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] uppercase font-bold text-stone-400">Instructor / Faculty</span>
                                        <span className="font-bold text-stone-800">{certificate.instructorName}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] uppercase font-bold text-stone-400">Credential ID</span>
                                        <span className="font-mono text-[11px] font-black text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                                            {certificate.certificateNumber}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
