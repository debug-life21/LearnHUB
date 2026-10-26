import test from "node:test";
import assert from "node:assert/strict";
import { normalizeExternalResource } from "../src/utils/externalResource.js";

test("YouTube links become privacy-enhanced embeds with recommendations limited", () => {
    const resource = normalizeExternalResource("youtube", "https://www.youtube.com/watch?v=abcdefghijk&t=30");
    assert.equal(resource.externalUrl, "https://www.youtube-nocookie.com/embed/abcdefghijk?rel=0&playsinline=1");
    assert.equal(resource.sourceUrl, "https://www.youtube.com/watch?v=abcdefghijk");
    assert.equal(resource.mimeType, "video/youtube");
});

test("Google Drive file links become preview embeds", () => {
    const resource = normalizeExternalResource("google_drive", "https://drive.google.com/file/d/1234567890abc/view?usp=sharing");
    assert.equal(resource.externalUrl, "https://drive.google.com/file/d/1234567890abc/preview");
    assert.equal(resource.mimeType, "application/pdf");
});

test("Google Docs, Sheets, and Slides links use their matching previews", () => {
    const document = normalizeExternalResource("google_drive", "https://docs.google.com/document/d/1234567890abc/edit");
    const spreadsheet = normalizeExternalResource("google_drive", "https://docs.google.com/spreadsheets/d/1234567890abc/edit");
    const presentation = normalizeExternalResource("google_drive", "https://docs.google.com/presentation/d/1234567890abc/edit");
    assert.equal(document.externalUrl, "https://docs.google.com/document/d/1234567890abc/preview");
    assert.equal(spreadsheet.externalUrl, "https://docs.google.com/spreadsheets/d/1234567890abc/preview");
    assert.equal(presentation.externalUrl, "https://docs.google.com/presentation/d/1234567890abc/preview");
});

test("external resource links reject unsafe and untrusted hosts", () => {
    assert.throws(() => normalizeExternalResource("youtube", "http://youtube.com/watch?v=abcdefghijk"), /HTTPS/);
    assert.throws(() => normalizeExternalResource("youtube", "https://notyoutube.com/watch?v=abcdefghijk"), /YouTube/);
    assert.throws(() => normalizeExternalResource("google_drive", "https://example.com/file/d/1234567890abc/view"), /Google Drive/);
});
