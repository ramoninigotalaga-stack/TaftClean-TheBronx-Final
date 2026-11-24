# TaftClean — The Bronx | WEBDEV Project

A responsive, functional **citizen garbage reporting prototype** based on the group's Canva desktop and mobile mockups. Built with plain HTML, CSS, and JavaScript; no installation or paid services required.

## Files

- `index.html` — homepage, How It Works, recent reports, footer
- `faq.html` — standalone FAQ page with expandable questions
- `report.html` — two-step report form and confirmation page
- `track.html` — report search, reference-number lookup, progress tracker
- `styles.css` — desktop and mobile responsive design
- `js/app.js` — navbar, demo records, browser storage, reference generator, regex patterns
- `js/report.js` — form validation, image upload / preview, saving report
- `js/track.js` — reference validation, status progression, demo controls
- `assets/` — images taken from the supplied Canva PDF files

## How to run (VS Code)

1. Extract this ZIP into a folder (don't open individual files while they are still inside ZIP).
2. Open the folder in VS Code.
3. Open `index.html` with **Live Server** (right click → **Open with Live Server**). You can also open `index.html` directly in Chrome; Live Server is preferred.
4. Visit **Home → Report** to submit a garbage report.
5. Copy the **99-####** reference number after submission, then choose **Track this report**.
6. You can also click a recent report on the homepage to open its tracking page. Refresh the tracking page: your submission is still available in that browser.
7. Resize Chrome or use **F12 → Toggle device toolbar** to test the hamburger navigation and mobile layout.

No external JavaScript libraries, CDNs, logins or API keys are required.

## Regex validation (sir's requirement)

**Client-side validation is defined in `js/app.js` and applied in `js/report.js` and `js/track.js`.** The website shows inline messages when input is invalid and prevents submission.

| Field | Validation |
|---|---|
| Email * | `/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/` — valid email format |
| Garbage Sub Type * | Must be one of the choices in the dropdown |
| Description * | 15–500 characters; Unicode letters, numbers, spaces and common punctuation (regex) |
| Date Observed * | Valid `YYYY-MM-DD` date and not in the future |
| Barangay/Street Segment * | 5–120 characters, letters/numbers/basic punctuation (regex) |
| Landmark | Optional; if supplied, 3–100 characters with allowed punctuation (regex) |
| Estimated Amount | Optional choice: Small Pile, Large Pile, Truckload |
| Photo | Optional JPG/PNG; maximum 5 MiB (5 × 1024 × 1024 bytes) |
| Tracking reference | `/^99-\d{4}$/` — example `99-6799` |

### Demo checklist

- [ ] Homepage matches the Canva layout on desktop and mobile.
- [ ] Mobile hamburger opens / closes, links navigate to all four pages.
- [ ] FAQ items expand and collapse.
- [ ] `bademail` does **not** pass the email regex; `person@example.com` passes.
- [ ] Fewer than 15 description characters shows an error.
- [ ] A future observed date shows an error.
- [ ] A very short street location shows an error.
- [ ] A PDF uploaded as a photo is rejected; a JPG/PNG under 5 MB is accepted.
- [ ] A valid report produces a unique reference number in `99-####` format.
- [ ] The new report can be tracked using its reference, including after refresh.
- [ ] The sample `99-6799` resolves to **Illegal Dumping**, **Under Review**, **October 20, 2026**.
- [ ] On the tracking page, expand **Prototype controls** to demonstrate Submitted → Under Review → Assigned → Resolved.
- [ ] A non-existent but correctly formatted reference shows **No matching report found**.

## Important limitation

**This is a working front-end classroom prototype, not a live civic reporting service.** Report text and statuses are saved in `localStorage`, and photos are saved in `IndexedDB` on the same browser and origin. Another computer/browser cannot see these reports. Reports are not automatically forwarded to a barangay or city office. Clearing the browser's site data removes local reports. Do not submit sensitive personal information in a demo.

To enable real multi-user submission, shared tracking, and authorized status changes, connect this interface to an authenticated backend + database (for example Supabase) and validate input again on the server. The demo status controls must be removed or protected before real deployment.

## Credits

- Design: Provided **Citizen Reporting Website (The Bronx)** Canva desktop/mobile PDF mockups.
- Implementation: WEBDEV Group The Bronx.
- Demo report data on the Home and Track pages comes from those mockups.

## Team collaboration — direct GitHub browser uploads

The team should upload each assigned file **after extracting** the member's ZIP. Do **not** upload the ZIP itself. All HTML files and `styles.css` belong in the repository root; scripts go in `js/` and images go in `assets/`. Do not place all files inside an extra `TaftClean-TheBronx` folder.

| Contributor | Assigned files | Responsibility |
|---|---|---|
| Member 1 / Inigo | `index.html`, `styles.css`, `assets/*`, `README.md`, `.nojekyll` | Homepage, full desktop/mobile styling, images, deployment |
| Member 2 / Basty | `report.html`, `js/report.js` | Reporting form and regex input validation |
| Member 3 | `track.html`, `js/track.js` | Tracking and demo status updates |
| Member 4 | `faq.html`, `js/app.js` | FAQ, shared mobile navigation, storage and regex definitions |

### Upload and test
1. Team lead creates repo **without** initializing with a README, and invites collaborators via Settings → Collaborators / Collaborators and teams → Add people (the screen's precise heading may vary).
2. Each member accepts their invite, opens repo → Add file → Upload files, then uploads **only their assigned extracted files**, respecting `js/` and `assets/` folders. Member 1 uploads first to initialize `main`, then Members 2–4 can upload their distinct files.
3. Choose “Commit directly to the main branch” and write a meaningful commit message. Each contributor should do separate commits under their GitHub account.
4. Team lead checks that all files now appear at the repository root and in their respective folders.
5. Turn on GitHub Pages: Settings → Pages → Deploy from a branch → main → /(root) → Save. `index.html` must be at the root.
6. Test the published site, create a report, save the reference, and track it. Remember that browser-local demo reports do **not** appear on another person's device.

**IMPORTANT**: `js/app.js` supplies shared functions that `js/report.js` and `js/track.js` depend upon. Forms and tracking will not work until the shared app script is uploaded. No member should edit another person's assigned files without coordinating changes.
