import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { api } from "../lib/api";

const OFFICE_FILE_TYPES = {
    ".docx": "docx",
    ".xlsx": "xlsx",
    ".pptx": "pptx",
};

export function OfficeDocumentPreview({ resource }) {
    const [state, setState] = useState({ loading: true, html: "", error: "" });

    useEffect(() => {
        let active = true;
        async function renderDocument() {
            setState({ loading: true, html: "", error: "" });
            try {
                const extension = resource.originalFilename?.match(/\.[^.]+$/)?.[0].toLowerCase();
                const fileType = OFFICE_FILE_TYPES[extension];
                if (!fileType) {
                    setState({
                        loading: false,
                        html: "",
                        error: "This Office file format cannot be previewed here. Please use DOCX, XLSX, or PPTX, or add a Google Drive preview link.",
                    });
                    return;
                }
                const [{ OfficeParser }, response] = await Promise.all([
                    import("officeparser"),
                    api.get(`/api/resources/${resource._id}/file`, { responseType: "arraybuffer" }),
                ]);
                if (!active) return;
                const file = new File(
                    [response.data],
                    resource.originalFilename,
                    { type: resource.mimeType || "application/octet-stream" },
                );
                const document = await OfficeParser.parseOffice(file, { fileType });
                const converted = await document.to("html");
                const html = DOMPurify.sanitize(converted.value, {
                    FORBID_TAGS: ["script", "iframe", "object", "embed", "form"],
                    FORBID_ATTR: ["srcdoc"],
                });
                if (active) setState({ loading: false, html, error: "" });
            } catch (error) {
                if (active) {
                    setState({
                        loading: false,
                        html: "",
                        error: error instanceof Error ? error.message : "This document could not be previewed.",
                    });
                }
            }
        }
        void renderDocument();
        return () => {
            active = false;
        };
    }, [resource._id, resource.mimeType, resource.originalFilename]);

    if (state.loading) {
        return <div role="status" className="flex min-h-[55vh] items-center justify-center bg-white text-sm font-semibold text-slate-600">Loading document preview…</div>;
    }
    if (state.error) {
        return <div role="alert" className="flex min-h-[55vh] flex-col items-center justify-center gap-3 bg-white p-6 text-center">
            <p className="max-w-lg text-sm text-slate-700">{state.error}</p>
            <p className="text-xs text-slate-500">For the best preview, use DOCX, XLSX, or PPTX files, or add the document from Google Drive.</p>
        </div>;
    }
    return (
        <iframe
            title={`${resource.title} preview`}
            srcDoc={state.html}
            sandbox=""
            className="min-h-[65vh] w-full border-0 bg-white"
        />
    );
}
