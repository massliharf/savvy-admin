// Poll / trivia preset helpers (pretty.js ~120747–121290, 121620–121760)

export const POLLS_DP = "polls"; // vc
export const STREAM_STATUS = { Scheduled: "Scheduled", InProgress: "InProgress", Canceled: "Canceled", Completed: "Completed" }; // Fo

// ---------------------------------------------------------------- preset form
export const PresetType = { Poll: "Poll", Trivia: "Trivia" }; // qi
export const MIN_ANSWERS = 2; // l9e
export const MAX_ANSWERS = 4; // u9e
export const MIN_DURATION = 5; // FV
export const MAX_DURATION = 300; // $V
export const DEFAULT_DURATION = 20; // c9e
export const MSG_QUESTION = "Please enter a question."; // d9e
export const MSG_DURATION = "Please enter a valid duration."; // f9e
export const MSG_CORRECT = "Select the correct answer."; // p9e
export const MSG_ANSWER = "Please enter an answer."; // h9e

// m9e
export function createDefaults(type) {
  return {
    type,
    question: "",
    durationSeconds: DEFAULT_DURATION,
    answers: [{ label: "" }, { label: "" }],
    correctAnswerIndex: null,
  };
}

// EZ
export function presetToForm(preset) {
  const idx = preset.options.findIndex((o) => o.optionId === preset.correctOptionId);
  return {
    type: preset.type,
    question: preset.question,
    durationSeconds: preset.durationSeconds,
    answers: preset.options.map((o) => ({ label: o.label })),
    correctAnswerIndex: idx === -1 ? null : idx,
  };
}

// M2
export function formToPayload(values, preset) {
  const isTrivia = values.type === PresetType.Trivia;
  const body = {
    type: values.type,
    question: values.question.trim(),
    options: values.answers.map((a) => ({ label: a.label.trim() })),
    correctOptionIndex: isTrivia ? values.correctAnswerIndex : null,
    durationSeconds: Number(values.durationSeconds),
    streamId: preset?.streamId ?? null,
  };
  return preset ? { ...body, sortOrder: preset.sortOrder } : body;
}

// v9e
export function assignPayload(preset, streamId) {
  return formToPayload(presetToForm(preset), { ...preset, streamId });
}

// ---------------------------------------------------------------- page caps / filter
export const MAX_PER_TYPE = 3; // Dl
export const Filter = { All: "All", Poll: "Poll", Trivia: "Trivia" }; // xa
export const FILTER_OPTIONS = [
  { value: Filter.All, label: "All" },
  { value: Filter.Poll, label: "Poll" },
  { value: Filter.Trivia, label: "Trivia" },
]; // y9e

// b9e
export function isAtCap(filter, nPoll, nTrivia) {
  const pollFull = nPoll >= MAX_PER_TYPE;
  const triviaFull = nTrivia >= MAX_PER_TYPE;
  return filter === Filter.Poll ? pollFull : (filter === Filter.Trivia || pollFull) && triviaFull;
}

// w9e
export function defaultTypeFor(filter, nPoll, nTrivia) {
  if (filter === Filter.Trivia) return PresetType.Trivia;
  if (filter === Filter.Poll) return PresetType.Poll;
  return nPoll >= MAX_PER_TYPE && nTrivia < MAX_PER_TYPE ? PresetType.Trivia : PresetType.Poll;
}

// S9e
export function capTooltip(filter) {
  if (filter === Filter.Poll) return `You already have ${MAX_PER_TYPE} polls. Delete one to add another.`;
  if (filter === Filter.Trivia) return `You already have ${MAX_PER_TYPE} trivia. Delete one to add another.`;
  return `You already have ${MAX_PER_TYPE} polls and ${MAX_PER_TYPE} trivia. Delete one to add another.`;
}

// ---------------------------------------------------------------- stream assignment
export const MAX_PER_STREAM = 3; // _2
// PZ
export function presetsOnStream(presets, streamId) {
  return presets.filter((p) => p.streamId === streamId);
}
// NV
export function isStreamFull(presets, streamId, presetId) {
  const on = presetsOnStream(presets, streamId);
  return on.length >= MAX_PER_STREAM && !on.some((p) => p.id === presetId);
}

export const TITLE_MAX = 18; // jV
export const CARD_DATE_FMT = "DD/MM HH:mm"; // C9e
export const ASSIGN_DATE_FMT = "DD/MM/YYYY HH:mm"; // BV
// x9e
export function truncateTitle(title) {
  const t = title.trim();
  return t.length <= TITLE_MAX ? t : `${t.slice(0, TITLE_MAX - 1).trimEnd()}…`;
}
// k9e
export const optionLetter = (i) => `${String.fromCharCode(65 + i)}.`;

// ---------------------------------------------------------------- export page
export const EXPORT_PAGE_SIZE = 100; // X9e
export const SEARCH_DEBOUNCE = 300; // Z9e
export const COMPARE_FMT = "YYYY-MM-DD"; // J9e
export const ROW_DATE_FMT = "MM/DD, h:mma"; // N9e
export const FILE_DATE_FMT = "MM-DD"; // j9e
export const RANGE_FMT = "MMM DD"; // WV

const STATUS_LABELS = {
  [STREAM_STATUS.Scheduled]: "Scheduled",
  [STREAM_STATUS.InProgress]: "Live",
  [STREAM_STATUS.Canceled]: "Canceled",
  [STREAM_STATUS.Completed]: "Ended",
}; // R9e
export const STATUS_ORDER = [
  STREAM_STATUS.Completed,
  STREAM_STATUS.InProgress,
  STREAM_STATUS.Scheduled,
  STREAM_STATUS.Canceled,
]; // A9e
// _R
export const statusLabel = (s) => STATUS_LABELS[s] ?? s;

// O9e
export function countLabel(total, selected) {
  const base = `${total} ${total === 1 ? "stream" : "streams"}`;
  return selected === 0 ? base : `${selected} of ${base}`;
}
// M9e
export function selectedLabel(n) {
  return n === 0 ? "No streams selected" : `${n} ${n === 1 ? "stream" : "streams"} selected`;
}
// _9e
export function selectAllState(total, sel) {
  return { checked: total > 0 && sel === total, indeterminate: sel > 0 && sel < total };
}
const EN_DASH = "–"; // L9e
// D9e
export function rangeLabel(from, to) {
  return from && to ? `${from} ${EN_DASH} ${to}` : from ? `From ${from}` : to ? `Until ${to}` : "";
}
// F9e
export function inRange(day, from, to) {
  return !((from && day < from) || (to && day > to));
}
// $9e
function slug(t) {
  return (
    t
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "streams"
  );
}
// z9e
export function exportFilename(title, n, mmdd) {
  return `${slug(title)}_${n}-${n === 1 ? "stream" : "streams"}_${mmdd}.csv`;
}

export const CSV_TYPE = "text/csv;charset=utf-8"; // B9e
const BOM = "﻿"; // LR
const CRLF = "\r\n"; // qV

// U9e — quote-aware row splitter
function splitRows(text) {
  const rows = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"') {
      quoted = !quoted;
      cur += ch;
      continue;
    }
    if (!quoted && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      rows.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur !== "") rows.push(cur);
  return rows;
}

// H9e
export function mergeCsv(texts) {
  let header = "";
  const rows = [];
  for (const raw of texts) {
    const text = raw.startsWith(BOM) ? raw.slice(1) : raw;
    const r = splitRows(text);
    if (r.length === 0) continue;
    if (!header) header = r[0];
    for (const row of r.slice(1)) if (row !== "") rows.push(row);
  }
  return header ? BOM + [header, ...rows].join(CRLF) + CRLF : BOM;
}
