# 🎁 Mystery Kris Kringle

A Christmas party gift game: everyone adds a wishlist, gets a secret **Mystery Person #** to shop for, and on party day you play trivia to win (or steal) bags. At the end, a big-screen reveal shows who every Mystery Person was — and who shopped for them.

## Pages

| Page | Who it's for |
|---|---|
| **Home** `#/` | Everyone — how the game works |
| **Join** `#/join` | Sign up with name + 4-digit PIN + 3–5 wishlist items |
| **My Mystery** `#/me` | After the draw: "You're shopping for Mystery #4" + their wishlist (no name) |
| **Organizer** `#/organizer` | Password-protected: see everyone, draw names, reset PINs, start the reveal |
| **Party board** `#/board` | Big screen: bags, trivia questions, scores, picks & steals. Read-only on phones |
| **Reveal** `#/reveal` | Card-flip reveal of each Mystery Person and their Secret Santa |

## Going live with Google Sheets (about 5 minutes)

Until you do this the site runs in **Demo Mode** (data saved only in your own browser, organizer password `demo`).

1. Create a new Google Sheet (e.g. "Kris Kringle 2026").
2. In the Sheet: **Extensions → Apps Script**. Delete what's there and paste the whole of [`apps-script/Code.gs`](apps-script/Code.gs). Save.
3. In the toolbar, choose the **`setup`** function and click **Run**. Approve the permissions (it's your own script).
   This creates the **Players**, **Settings** and **Trivia** tabs.
4. In the Sheet's **Settings** tab, change **adminPassword** from `change-me` to your own password. Set the deadline and party date if you like.
5. Back in Apps Script: **Deploy → New deployment → ⚙ Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   
   Click **Deploy** and copy the **Web app URL** (ends in `/exec`).
6. Put that URL in [`js/config.js`](js/config.js) as `apiUrl` and commit. The site goes live in a minute.

### Keeping it secret
- The website never shows names next to Mystery numbers until you start the reveal — the script only hands out what each person is allowed to see.
- **Don't share the Google Sheet** — it shows everything (that's your organizer view).
- PINs are stored scrambled (hashed), not as plain numbers.
- On the Organizer page, secret columns are hidden until you click **Show who's who** — handy if your screen is projected.

### Editing trivia
Edit, add or reorder questions in the **Trivia** tab of the Sheet. The party board reads them in order.

### If you change `Code.gs` later
Use **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy** so the URL stays the same.

## Party-day flow
1. Organizer opens **Party board** on the TV and logs in.
2. Ask a question → tap **+** for whoever answers right first.
3. When someone reaches 3, they pick a bag from the table or steal one (a bag locks after 2 steals — adjustable in ⚙ Rules). Robbed players rejoin the trivia.
4. When every bag has a home, everyone opens together.
5. Organizer page → **Start the reveal** → put **Reveal** on the TV and press space to flip each card.
6. Trade!

---
Built with plain HTML/CSS/JS on GitHub Pages + a Google Apps Script backend. `js/core.js` holds the game rules and is shared by both the site's demo mode and the Apps Script (`node tools/build.js` regenerates `Code.gs`).
