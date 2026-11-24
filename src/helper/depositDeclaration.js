function upper(value) {
  return String(value || "").trim().toUpperCase();
}

function declarationBlank(value) {
  return value == null || String(value).trim() === "";
}

/**
 * History row labels. Returns null when the pair is not one of the declaration cases,
 * so older status strings keep their existing label.
 */
export function depositRowPresentation(status, declarationStatus) {
  const s = upper(status);
  const d = declarationBlank(declarationStatus) ? "" : upper(declarationStatus);
  if (s === "PENDING" && d === "") {
    return { label: "Pending", tone: "pending", needsSenderConfirm: false };
  }
  // Web requires declaration_status PENDING. The history payload often omits that field
  // while status is already AWAITING_DECLARATION, which is the same "Provide Details" case.
  if (s === "AWAITING_DECLARATION" && (d === "PENDING" || d === "")) {
    return { label: "Provide Details", tone: "pending", needsSenderConfirm: true };
  }
  if (s === "COMPLETED" && (d === "SUBMITTED" || d === "")) {
    return { label: "Credited", tone: "success", needsSenderConfirm: false };
  }
  if (s === "REJECTED") {
    return { label: "Blocked", tone: "danger", needsSenderConfirm: false };
  }
  return null;
}

export function fallbackHistoryStatusLabel(raw) {
  const t = raw == null ? "" : String(raw).trim();
  if (!t) return "—";
  if (/^AWAITING_DECLARATION$/i.test(t)) return "AWAITING_DECLARATION";
  if (/success|completed|credited|confirm/i.test(t)) return "COMPLETED";
  if (/pending|processing|in progress|confirming|queued|wait/i.test(t)) return "PENDING";
  if (/fail|failed|reject|rejected|cancel|error/i.test(t)) return "FAILED";
  return t.toUpperCase();
}

export function presentDepositStatus(status, declarationStatus) {
  const presentation = depositRowPresentation(status, declarationStatus);
  if (presentation) return presentation;
  const label = fallbackHistoryStatusLabel(status);
  const tone =
    label === "COMPLETED" ? "success" : label === "PENDING" || label === "AWAITING_DECLARATION" ? "pending" : label === "FAILED" ? "danger" : "info";
  return { label, tone, needsSenderConfirm: false };
}

function textValue(value) {
  if (value == null || typeof value === "object") return "";
  return String(value).trim();
}

/** Prefer the declaration status over a generic PENDING sitting on `status`. */
export function readDepositStatus(raw) {
  if (!raw || typeof raw !== "object") return "";
  const meta = raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {};
  const values = [
    raw.status,
    raw.deposit_status,
    raw.transaction_status,
    raw.action,
    raw.state,
    meta.status,
    meta.deposit_status,
  ].map(textValue).filter((v) => v && v !== "—");
  const awaiting = values.find((v) => upper(v) === "AWAITING_DECLARATION");
  if (awaiting) return awaiting;
  const rejected = values.find((v) => upper(v) === "REJECTED");
  if (rejected) return rejected;
  const completed = values.find((v) => upper(v) === "COMPLETED");
  if (completed) return completed;
  return values[0] || "";
}

export function readDeclarationStatus(raw) {
  if (!raw || typeof raw !== "object") return "";
  const meta = raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {};
  const declaration = raw.declaration && typeof raw.declaration === "object" ? raw.declaration : {};
  const value =
    raw.declaration_status ??
    raw.declarationStatus ??
    declaration.status ??
    declaration.declaration_status ??
    meta.declaration_status ??
    meta.declarationStatus ??
    "";
  return textValue(value);
}

export function localDeclarationError(state) {
  if (state.senderIsSelf !== true && state.senderIsSelf !== false) {
    return "Say whether you sent this deposit";
  }
  if (state.sourceType !== "PRIVATE_WALLET" && state.sourceType !== "EXCHANGE") {
    return "Choose a private wallet or an exchange";
  }
  if (state.senderIsSelf === false && state.senderType !== "PERSONAL" && state.senderType !== "COMPANY") {
    return "Choose individual or company";
  }
  const personal = state.senderIsSelf === true || state.senderType === "PERSONAL";
  if (personal && (!String(state.firstName || "").trim() || !String(state.lastName || "").trim())) {
    return "First name and last name are required";
  }
  if (state.senderIsSelf === false && state.senderType === "COMPANY" && !String(state.companyName || "").trim()) {
    return "Company name is required";
  }
  if (!String(state.country || "").trim()) return "Country is required";
  if (state.sourceType === "EXCHANGE" && !String(state.exchangeName || "").trim()) {
    return "Exchange name is required";
  }
  if (state.confirmed !== true) return "Confirm that the information is true";
  return "";
}

/** Body contains only the fields that apply. The server stores PERSONAL when the sender is self. */
export function buildDeclarationBody(state) {
  const body = {
    sender_is_self: state.senderIsSelf,
    source_type: state.sourceType,
    country: String(state.country || "").trim(),
    confirmed: true,
  };
  if (state.senderIsSelf === false) {
    body.sender_type = state.senderType;
  }
  if (state.senderIsSelf === true || state.senderType === "PERSONAL") {
    body.first_name = String(state.firstName || "").trim();
    body.last_name = String(state.lastName || "").trim();
  }
  if (state.senderIsSelf === false && state.senderType === "COMPANY") {
    body.company_name = String(state.companyName || "").trim();
  }
  if (state.sourceType === "EXCHANGE") {
    body.exchange_name = String(state.exchangeName || "").trim();
  }
  return body;
}

export function classifyDeclarationSubmit(res) {
  if (res && res.success === true) {
    return { kind: "ok", message: res.message || "", data: res.data && typeof res.data === "object" ? res.data : {} };
  }
  const code = res?.code || "";
  if (code === "DECLARATION_INVALID") {
    return { kind: "invalid", message: res?.message || "" };
  }
  if (code === "DEPOSIT_NOT_FOUND" || code === "DECLARATION_NOT_REQUIRED") {
    return { kind: "leave" };
  }
  return { kind: "retry" };
}

export function classifyDeclarationDetail(res) {
  if (res && res.success === true && res.data && res.data.deposit) {
    return { kind: "ok", data: res.data };
  }
  if (res?.code === "DEPOSIT_NOT_FOUND") return { kind: "leave" };
  return { kind: "error", message: res?.message || "Could not load this deposit." };
}

export function optionLabel(options, value) {
  const list = Array.isArray(options) ? options : [];
  const hit = list.find((opt) => opt && (opt.value === value || String(opt.value) === String(value)));
  if (hit && hit.label) return String(hit.label);
  if (value == null || value === "") return "";
  return String(value);
}

export function declarationChoiceValue(value) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return value;
}

export function stepReady(step, state) {
  if (step === 0) return state.senderIsSelf === true || state.senderIsSelf === false;
  if (step === 1) {
    if (state.senderIsSelf === false && state.senderType !== "PERSONAL" && state.senderType !== "COMPANY") {
      return false;
    }
    const personal = state.senderIsSelf === true || state.senderType === "PERSONAL";
    if (personal && (!String(state.firstName || "").trim() || !String(state.lastName || "").trim())) return false;
    if (state.senderIsSelf === false && state.senderType === "COMPANY" && !String(state.companyName || "").trim()) {
      return false;
    }
    return Boolean(String(state.country || "").trim());
  }
  if (state.sourceType !== "PRIVATE_WALLET" && state.sourceType !== "EXCHANGE") return false;
  if (state.sourceType === "EXCHANGE" && !String(state.exchangeName || "").trim()) return false;
  return state.confirmed === true;
}
