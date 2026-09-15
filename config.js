// ---------------------------------------------------------------------------
// Civic Signup configuration
// ---------------------------------------------------------------------------
// SUBMIT_ENDPOINT: the URL that receives each signup as a POST.
//   Paste the Google Apps Script "Web app" URL here (see README.md).
//   It looks like: https://script.google.com/macros/s/AKfycb.../exec
//   Leave it empty ("") and the form falls back to a copy/email summary.
//
// FALLBACK_EMAIL: used only when SUBMIT_ENDPOINT is empty. If set, the
//   fallback offers a prefilled "mailto:" link to this address.
// ---------------------------------------------------------------------------
window.CIVIC_SIGNUP_CONFIG = {
  SUBMIT_ENDPOINT: "",
  FALLBACK_EMAIL: "",
  SITE_NAME: "Trustee Cory J. Wesley",
  HOME_URL: "https://corywesley.com",
};
