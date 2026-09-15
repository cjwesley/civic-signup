/**
 * Civic Signup backend — Google Apps Script
 * ------------------------------------------------------------------
 * Appends every signup from the GitHub Pages form as a row in the
 * Google Sheet below. Deploy as a Web app (Execute as: Me, Who has
 * access: Anyone) and paste the /exec URL into config.js.
 *
 * Columns: Timestamp | Name | Email | Volunteer | Internship |
 *          Trustee Shadow Day | Description | Source
 */

var SHEET_ID = '1OkuvOSvzdKq98dGRjwpTREkb2IfyL-aWeCLb0O6BNNg';
var SHEET_NAME = 'Signups';          // created on first submission if missing
var NOTIFY_EMAIL = '';               // optional: get an email per signup

var HEADERS = [
  'Timestamp', 'Name', 'Email', 'Volunteer', 'Internship',
  'Trustee Shadow Day', 'Description', 'Source'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var data = parseBody_(e);
    if (data.website) {                       // honeypot filled = bot
      return json_({ ok: true, ignored: true });
    }
    var name = clean_(data.name);
    var email = clean_(data.email);
    if (!name || !email) {
      return json_({ ok: false, error: 'Name and email are required.' });
    }
    var row = [
      new Date(),
      name,
      email,
      yesNo_(data.volunteer),
      yesNo_(data.internship),
      yesNo_(data.shadowDay),
      clean_(data.description),
      clean_(data.source) || 'civic-signup'
    ];
    var sheet = getSheet_();
    sheet.appendRow(row);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: 'New civic signup: ' + name,
        body: HEADERS.map(function (h, i) { return h + ': ' + row[i]; }).join('\n')
      });
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function doGet() {
  return json_({ ok: true, service: 'civic-signup', hint: 'POST signups to this URL.' });
}

// --- helpers ---------------------------------------------------------------

function parseBody_(e) {
  if (e && e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (_) {}
  }
  return (e && e.parameter) || {};
}

function getSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    var first = ss.getSheets()[0];
    if (first && first.getLastRow() === 0) {
      sheet = first;
      sheet.setName(SHEET_NAME);
    } else {
      sheet = ss.insertSheet(SHEET_NAME);
    }
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function clean_(v) {
  return v == null ? '' : String(v).trim().slice(0, 5000);
}

function yesNo_(v) {
  return (v === true || v === 'true' || v === 'yes' || v === 'on' || v === '1') ? 'Yes' : 'No';
}

/** Run this once from the editor to verify sheet access and create headers. */
function setupSheet() {
  var sheet = getSheet_();
  Logger.log('OK: ' + sheet.getParent().getName() + ' / ' + sheet.getName());
}
