// core: pain.001 XML -> payments -> payme links. Pure functions, no DOM access.
// index.html loads it as a plain script; in Node it exports the same functions for tests.

function kid(el, name) {
  if (!el) return null;
  for (let c = el.firstChild; c; c = c.nextSibling) {
    if (c.nodeType === 1 && c.localName === name) return c;
  }
  return null;
}

function kids(el, name) {
  const out = [];
  if (!el) return out;
  for (let c = el.firstChild; c; c = c.nextSibling) {
    if (c.nodeType === 1 && c.localName === name) out.push(c);
  }
  return out;
}

function at(el, path) {
  let cur = el;
  for (const n of path.split("/")) cur = kid(cur, n);
  return cur;
}

function txt(el, path) {
  const n = at(el, path);
  return n && n.textContent ? n.textContent.trim() : "";
}

function stripDiacritics(s) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function ibanOk(iban) {
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(iban)) return false;
  const s = iban.slice(4) + iban.slice(0, 4);
  let r = 0;
  for (const ch of s) {
    const v = /[0-9]/.test(ch) ? ch : String(ch.charCodeAt(0) - 55);
    for (const d of v) r = (r * 10 + Number(d)) % 97;
  }
  return r === 1;
}

function toCents(amount) {
  if (!/^\d+(\.\d{1,2})?$/.test(amount)) return NaN;
  const [whole, frac = ""] = amount.split(".");
  return Number(whole) * 100 + Number((frac + "00").slice(0, 2));
}

function symbols(endToEndId) {
  const pick = (code) => {
    const m = endToEndId.match(new RegExp("/" + code + "([0-9]*)"));
    return m ? m[1] : "";
  };
  return { vs: pick("VS"), ss: pick("SS"), ks: pick("KS") };
}

// Same rule as Python urllib.parse.quote_plus for the characters we emit.
function qp(s) {
  return encodeURIComponent(s).replace(/%20/g, "+");
}

function paymeLink(p, today) {
  let q = "IBAN=" + p.iban + "&AM=" + p.amount + "&CC=EUR";
  if (p.dueDate && p.dueDate > today) q += "&DT=" + p.dueDate;
  if (p.reference) q += "&PI=" + qp(p.reference);
  if (p.message) q += "&MSG=" + qp(p.message);
  q += "&CN=" + qp(p.creditor);
  return "https://payme.sk/2/p/PME?" + q;
}

// doc: a parsed XML Document. today: "YYYYMMDD".
// Returns { payers, payments, totalCents, errors } and never throws on bad content.
function parsePain001(doc, today) {
  const errors = [];
  const root = doc && doc.documentElement;
  const init = kid(root, "CstmrCdtTrfInitn");
  if (!root || root.localName !== "Document" || !init) {
    return { payers: [], payments: [], totalCents: 0, errors: ["Súbor nie je platobný príkaz vo formáte SEPA XML (pain.001)."] };
  }
  const hdr = kid(init, "GrpHdr");
  const payers = [];
  const payments = [];
  for (const pmt of kids(init, "PmtInf")) {
    const payer = {
      name: txt(pmt, "Dbtr/Nm"),
      iban: txt(pmt, "DbtrAcct/Id/IBAN").replace(/\s/g, "").toUpperCase(),
      date: txt(pmt, "ReqdExctnDt").replace(/-/g, ""),
    };
    payers.push(payer);
    for (const tx of kids(pmt, "CdtTrfTxInf")) {
      const warn = [];
      const amtEl = at(tx, "Amt/InstdAmt");
      const amount = amtEl ? amtEl.textContent.trim() : "";
      const currency = amtEl ? amtEl.getAttribute("Ccy") : "";
      const cents = toCents(amount);
      const iban = txt(tx, "CdtrAcct/Id/IBAN").replace(/\s/g, "").toUpperCase();
      let reference = txt(tx, "PmtId/EndToEndId");
      if (reference.toUpperCase() === "NOTPROVIDED") reference = "";
      let creditor = stripDiacritics(txt(tx, "Cdtr/Nm"));
      let message = stripDiacritics(txt(tx, "RmtInf/Ustrd"));
      if (!ibanOk(iban)) warn.push("IBAN príjemcu nemá platný kontrolný súčet.");
      if (currency !== "EUR") warn.push("Mena " + currency + " nie je podporovaná, odkaz payme vie len EUR.");
      if (!(cents > 0)) warn.push("Suma " + amount + " nie je platná.");
      if (amount.length > 9) warn.push("Suma je dlhšia ako 9 znakov, štandard payme ju nepovolí.");
      if (!creditor) warn.push("Chýba meno príjemcu, štandard payme ho vyžaduje.");
      if (reference.length > 35) { warn.push("Identifikácia platby je dlhšia ako 35 znakov, skrátená."); reference = reference.slice(0, 35); }
      if (creditor.length > 70) { warn.push("Meno príjemcu je dlhšie ako 70 znakov, skrátené."); creditor = creditor.slice(0, 70); }
      if (message.length > 140) { warn.push("Správa je dlhšia ako 140 znakov, skrátená."); message = message.slice(0, 140); }
      const p = {
        amount, cents, currency, iban, reference, creditor, message,
        bic: txt(tx, "CdtrAgt/FinInstnId/BIC"),
        street: stripDiacritics(kids(at(tx, "Cdtr/PstlAdr"), "AdrLine")[0]?.textContent.trim() || ""),
        city: stripDiacritics(kids(at(tx, "Cdtr/PstlAdr"), "AdrLine")[1]?.textContent.trim() || ""),
        dueDate: payer.date,
        payer,
        ...symbols(reference),
        warnings: warn,
      };
      p.link = paymeLink(p, today);
      payments.push(p);
    }
  }
  const totalCents = payments.reduce((s, p) => s + (p.cents || 0), 0);
  const nb = Number(txt(hdr, "NbOfTxs"));
  const ctrl = txt(hdr, "CtrlSum");
  if (!payments.length) errors.push("Súbor neobsahuje žiadnu platbu.");
  if (nb && nb !== payments.length) errors.push("Hlavička uvádza " + nb + " platieb, súbor ich obsahuje " + payments.length + ".");
  if (ctrl && toCents(ctrl) !== totalCents) errors.push("Kontrolný súčet v hlavičke (" + ctrl + ") nesedí so súčtom platieb.");
  return { payers, payments, totalCents, errors };
}

// Data model for bysquare/pay encode(). type 1 = PaymentOptions.PaymentOrder.
function bysquareModel(p, today) {
  const pay = {
    type: 1,
    amount: p.cents / 100,
    currencyCode: "EUR",
    beneficiary: { name: p.creditor },
    bankAccounts: [{ iban: p.iban }],
  };
  if (p.vs) pay.variableSymbol = p.vs;
  if (p.ss) pay.specificSymbol = p.ss;
  if (p.ks) pay.constantSymbol = p.ks;
  if (p.message) pay.paymentNote = p.message;
  if (p.bic) pay.bankAccounts[0].bic = p.bic;
  if (p.street) pay.beneficiary.street = p.street;
  if (p.city) pay.beneficiary.city = p.city;
  if (p.dueDate && p.dueDate > today) pay.paymentDueDate = p.dueDate;
  return { payments: [pay] };
}

// Plain-text email body. fmt formats cents as "1 030,50 EUR".
function emailText(result, fmt, ibanFmt) {
  const lines = [];
  result.payments.forEach((p, i) => {
    const sym = [p.vs && "VS " + p.vs, p.ss && "SS " + p.ss, p.ks && "KS " + p.ks].filter(Boolean).join(", ");
    lines.push((i + 1) + ") " + p.creditor + ": " + fmt(p.cents));
    lines.push("   IBAN " + ibanFmt(p.iban) + (sym ? ", " + sym : ""));
    if (p.message) lines.push("   Správa: " + p.message);
    lines.push("   Zaplatiť: " + p.link, "");
  });
  return lines.join("\n");
}

if (typeof module !== "undefined") module.exports = { parsePain001, emailText, bysquareModel, ibanOk, toCents, paymeLink };
