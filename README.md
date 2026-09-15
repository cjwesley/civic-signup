# Civic Signup

A one-page signup site for students interested in volunteer work, an
internship, or a Trustee Shadow Day with Oak Park Village Trustee
Cory J. Wesley. Branded after [corywesley.com](https://corywesley.com).

Static HTML/CSS/JS, hosted on GitHub Pages. Submissions are written to a
Google Sheet by a small Google Apps Script web app.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The page: hero, three options, signup form, Shadow Day explainer |
| `styles.css` | Brand styles (Montserrat, sky blue `#38B6FF`, pink `#FF66C4`, black) |
| `app.js` | Validation, submit, success and fallback panels |
| `config.js` | **The only file you need to edit.** Endpoint URL and fallback email |
| `backend/Code.gs` | Google Apps Script that appends each signup to the Google Sheet |

## Turn on the Google Sheet backend (about 5 minutes, one time)

The sheet: <https://docs.google.com/spreadsheets/d/1OkuvOSvzdKq98dGRjwpTREkb2IfyL-aWeCLb0O6BNNg/edit>

1. Open the sheet, then **Extensions → Apps Script**.
2. Delete the placeholder code in `Code.gs` and paste in the contents of
   [`backend/Code.gs`](backend/Code.gs). Save (Ctrl+S).
3. Optional: in the editor, pick the `setupSheet` function and click **Run**.
   Approve the permission prompt. This creates the header row and confirms
   the script can reach the sheet.
4. Click **Deploy → New deployment**. Click the gear next to "Select type"
   and choose **Web app**. Set:
   - Description: `civic signup`
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, approve the permission prompt if asked, and copy the
   **Web app URL** (ends in `/exec`).
6. Open `config.js` in this repo and paste that URL into `SUBMIT_ENDPOINT`.
   Commit and push (or edit the file directly on GitHub). GitHub Pages
   redeploys in about a minute.

Each signup then lands as a row:

`Timestamp | Name | Email | Volunteer | Internship | Trustee Shadow Day | Description | Source`

Export any time with **File → Download → CSV**.

### Optional extras in `Code.gs`

- `NOTIFY_EMAIL`: set to an address to get an email for every signup.
- `SHEET_NAME`: the tab name to write to (created if missing).

### Updating the script later

After editing `Code.gs`, use **Deploy → Manage deployments → Edit (pencil)
→ Version: New version → Deploy**. The URL stays the same.

## Until the endpoint is set

With `SUBMIT_ENDPOINT` empty, the form still validates and then shows the
student a copyable summary of their signup with instructions to email it.
Set `FALLBACK_EMAIL` in `config.js` to also give them a one-click
"Open in email" button. Nothing is stored anywhere in this mode.

## Using a different backend

Anything that accepts an HTTP POST works. The form sends a JSON body
(as `text/plain` to avoid a CORS preflight) shaped like:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "volunteer": true,
  "internship": false,
  "shadowDay": true,
  "description": "…",
  "website": "",
  "source": "civic-signup",
  "submittedAt": "2026-09-15T12:00:00.000Z",
  "page": "https://…"
}
```

`website` is a honeypot field. If it is non-empty the submission is a bot
and should be ignored.

## Local preview

Open `index.html` directly in a browser, or serve the folder:

```bash
npx serve .
```
