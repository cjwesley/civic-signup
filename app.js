/* Civic Signup — form behavior
   Reads window.CIVIC_SIGNUP_CONFIG (config.js). Posts each signup as JSON
   text to SUBMIT_ENDPOINT; falls back to a copy/email summary if unset. */
(function () {
  "use strict";

  var CONFIG = window.CIVIC_SIGNUP_CONFIG || {};
  var ENDPOINT = (CONFIG.SUBMIT_ENDPOINT || "").trim();
  var FALLBACK_EMAIL = (CONFIG.FALLBACK_EMAIL || "").trim();

  var $ = function (id) { return document.getElementById(id); };
  var form = $("signup-form");
  if (!form) return;

  var els = {
    name: $("name"),
    email: $("email"),
    volunteer: $("volunteer"),
    internship: $("internship"),
    shadowDay: $("shadowDay"),
    description: $("description"),
    website: $("website"),
    submit: $("submit-btn"),
    status: $("form-status"),
    descField: $("desc-field"),
    descCount: $("desc-count"),
    success: $("success"),
    successMsg: $("success-msg"),
    another: $("another-btn"),
    fallback: $("fallback"),
    fallbackText: $("fallback-text"),
    copy: $("copy-btn"),
    mailto: $("mailto-btn"),
    fallbackBack: $("fallback-back")
  };

  var lastPayload = null;

  // --- description box reacts to volunteer / internship --------------------
  function needsDescription() {
    return els.volunteer.checked || els.internship.checked;
  }
  function syncDescription() {
    var needed = needsDescription();
    els.descField.classList.toggle("dimmed", !needed);
    els.description.setAttribute("aria-required", needed ? "true" : "false");
  }
  function syncCounter() {
    els.descCount.textContent = els.description.value.length + " / 2000";
  }
  [els.volunteer, els.internship, els.shadowDay].forEach(function (cb) {
    cb.addEventListener("change", function () {
      syncDescription();
      clearError("interest");
    });
  });
  els.description.addEventListener("input", function () {
    syncCounter();
    clearError("description");
  });
  els.name.addEventListener("input", function () { clearError("name"); });
  els.email.addEventListener("input", function () { clearError("email"); });
  syncDescription();
  syncCounter();

  // --- validation ------------------------------------------------------------
  function fieldWrap(key) {
    var input = els[key];
    return input ? input.closest(".field") : null;
  }
  function showError(key) {
    var msg = $(key + "-error");
    if (msg) msg.hidden = false;
    var wrap = key === "interest" ? els.volunteer.closest(".field") : fieldWrap(key);
    if (wrap) wrap.classList.add("invalid");
  }
  function clearError(key) {
    var msg = $(key + "-error");
    if (msg) msg.hidden = true;
    var wrap = key === "interest" ? els.volunteer.closest(".field") : fieldWrap(key);
    if (wrap) wrap.classList.remove("invalid");
  }
  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  }
  function validate() {
    var ok = true;
    var firstBad = null;

    if (!els.name.value.trim()) { showError("name"); ok = false; firstBad = firstBad || els.name; }
    if (!validEmail(els.email.value.trim())) { showError("email"); ok = false; firstBad = firstBad || els.email; }
    if (!els.volunteer.checked && !els.internship.checked && !els.shadowDay.checked) {
      showError("interest"); ok = false; firstBad = firstBad || els.volunteer;
    }
    if (needsDescription() && !els.description.value.trim()) {
      showError("description"); ok = false; firstBad = firstBad || els.description;
    }
    if (firstBad) firstBad.focus();
    return ok;
  }

  // --- payload ---------------------------------------------------------------
  function buildPayload() {
    return {
      name: els.name.value.trim(),
      email: els.email.value.trim(),
      volunteer: els.volunteer.checked,
      internship: els.internship.checked,
      shadowDay: els.shadowDay.checked,
      description: els.description.value.trim(),
      website: els.website.value,          // honeypot
      source: "civic-signup",
      submittedAt: new Date().toISOString(),
      page: location.href
    };
  }
  function interestsList(p) {
    var out = [];
    if (p.volunteer) out.push("Volunteer work");
    if (p.internship) out.push("Internship");
    if (p.shadowDay) out.push("Trustee Shadow Day");
    return out;
  }
  function summaryText(p) {
    return [
      "Civic Signup",
      "Name: " + p.name,
      "Email: " + p.email,
      "Interested in: " + interestsList(p).join(", "),
      "Description: " + (p.description || "(none)"),
      "Submitted: " + new Date(p.submittedAt).toLocaleString()
    ].join("\n");
  }

  // --- submit ----------------------------------------------------------------
  function setStatus(text, kind) {
    els.status.textContent = text || "";
    els.status.className = "status" + (kind ? " " + kind : "");
  }
  function setBusy(busy) {
    els.submit.disabled = busy;
    els.submit.textContent = busy ? "Sending…" : "Submit signup";
  }

  function postSignup(payload) {
    var body = JSON.stringify(payload);
    // text/plain keeps this a "simple" request (no CORS preflight), which is
    // what Google Apps Script web apps and most form endpoints expect.
    return fetch(ENDPOINT, {
      method: "POST",
      mode: "cors",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: body
    }).then(function (res) {
      return res.text().then(function (txt) {
        var data = null;
        try { data = JSON.parse(txt); } catch (_) {}
        if (!res.ok) throw new Error("HTTP " + res.status);
        if (data && data.ok === false) throw new Error(data.error || "Rejected");
        return data || { ok: true };
      });
    }).catch(function (err) {
      // Some browsers refuse to read the redirected Apps Script response.
      // Re-send opaquely so the row is still written, then report success.
      if (err && /HTTP|Rejected|required/i.test(err.message)) throw err;
      return fetch(ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: body
      }).then(function () { return { ok: true, opaque: true }; });
    });
  }

  function showSuccess(p) {
    form.hidden = true;
    els.fallback.hidden = true;
    els.success.hidden = false;
    els.successMsg.textContent = "Thanks, " + p.name.split(" ")[0] + "! We'll be in touch at " + p.email +
      " about " + interestsList(p).join(", ").toLowerCase() + ".";
    els.success.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showFallback(p) {
    var text = summaryText(p);
    els.fallbackText.textContent = text;
    if (FALLBACK_EMAIL) {
      els.mailto.href = "mailto:" + encodeURIComponent(FALLBACK_EMAIL) +
        "?subject=" + encodeURIComponent("Civic signup: " + p.name) +
        "&body=" + encodeURIComponent(text);
      els.mailto.hidden = false;
    } else {
      els.mailto.hidden = true;
    }
    form.hidden = true;
    els.success.hidden = true;
    els.fallback.hidden = false;
    els.fallback.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    setStatus("");
    if (!validate()) {
      setStatus("Please fix the highlighted fields.", "error-msg");
      return;
    }
    var payload = buildPayload();
    lastPayload = payload;

    if (payload.website) {            // bot filled the honeypot; pretend success
      showSuccess(payload);
      return;
    }
    if (!ENDPOINT) {
      showFallback(payload);
      return;
    }

    setBusy(true);
    postSignup(payload).then(function () {
      setBusy(false);
      showSuccess(payload);
    }).catch(function (err) {
      setBusy(false);
      setStatus("Sorry, that didn't go through (" + (err && err.message ? err.message : "network error") +
        "). Please try again, or use the copy option below.", "error-msg");
      // Give them a way out rather than a dead end.
      setTimeout(function () { showFallback(payload); }, 1200);
    });
  });

  // --- panel buttons ---------------------------------------------------------
  function backToForm(reset) {
    els.success.hidden = true;
    els.fallback.hidden = true;
    form.hidden = false;
    if (reset) {
      form.reset();
      syncDescription();
      syncCounter();
      setStatus("");
    }
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  els.another.addEventListener("click", function () { backToForm(true); });
  els.fallbackBack.addEventListener("click", function () { backToForm(false); });
  els.copy.addEventListener("click", function () {
    var text = els.fallbackText.textContent;
    var done = function () {
      els.copy.textContent = "Copied!";
      setTimeout(function () { els.copy.textContent = "Copy summary"; }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { legacyCopy(text); done(); });
    } else {
      legacyCopy(text); done();
    }
  });
  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", "");
    ta.style.position = "absolute"; ta.style.left = "-9999px";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (_) {}
    document.body.removeChild(ta);
  }
})();
