# Front-end check

Go through every screen. For each item: does it work, is it clear, is anything unnecessary? Note bugs next to the item.
Backend issues go to Chris (`docs/BACKEND_REQUESTS.md`). Visual redesign comes **after** this list.

Legend: ✅ works · ❌ broken · ✏️ works but change wording or layout · ➖ remove

## 0. Everywhere
- [ ] Header: logo goes home, name shown, Log out works
- [oki] Language switch EN / FI / SV keeps you on the same page
- [oki] Finnish and Swedish texts exist on every screen (not only the landing page)
- [ ] Logged-out visitor opening a portal page goes to login, then back to that page
- [ ] Wrong role (company opening `/city`) is sent to its own portal
- [ ] Every button shows a busy state and a clear error message when something fails
- [ ] Empty states make sense ("no candidates yet")
- [ ] Times are Finnish time, with start and end
- [ ] Rate limit message is friendly ("Too many attempts…")
- [ ] Phone width: nothing cut off, nothing scrolls sideways
- [ ] Keyboard: every action reachable with Tab and Enter, focus visible
- [ ] After a deploy, an old open tab does not break login (reload)

## 1. Public pages
- [ ] Landing: text matches the product today (panel, proofs, no CV, testing rooms)
- [ ] "Take a skill check" goes to signup or login
- [ ] Sign up as jobseeker: name, email, password, lands on the dashboard
- [ ] Sign up as company: lands on the company portal
- [ ] Log in: wrong password shows an error, right one goes to the right portal
- [ ] Demo page `/demo`: opens the kiosk for a booked jobseeker

## 2. Jobseeker
**Dashboard**
- [ ] Testing time shows place, start and end, the chosen needs
- [ ] Cancel only before the start. Change time only until 2 h before, max 2 times
- [ ] "Start skill check" appears during the slot, pop-up explains the testing room
- [ ] Past bookings disappear, missed ones carry no penalty
- [ ] Results list: status words clear (in progress, ready, waiting for review)

**Booking**
- [ ] Choose 1 to 3 needs, choose a free slot, confirm
- [ ] Full slots not offered, booking appears on the dashboard

**Kiosk (skill check)**
- [ ] Only the booked person can log in on that computer, others get a clear message
- [ ] Need list: Start for new, Continue for unfinished
- [ ] Choose language, start
- [ ] Type an answer, send. "What you said" and "What the AI saw" both visible
- [ ] Microphone: record, see the text, edit, send (Finnish, Swedish, English)
- [ ] Waiting for the panel (20 to 60 s): clear "thinking" state, no double send
- [ ] Panel error: friendly "send again" message
- [ ] End of interview: thank-you, then the result (report can take 1 to 3 min)
- [ ] Logged out automatically at the end, kiosk ready for the next person

**Result page**
- [ ] Match, level, confidence, quotes per skill, language result, proofs
- [ ] Panel results show sensibly (no empty fields, no "undefined")
- [ ] Share with similar companies (consent), show on event card (consent)
- [ ] Book a 15-minute meeting after an accept, see it on the dashboard
- [ ] Share contact with one company, withdraw again

**Other pages**
- [ ] Proofs: add (language needs a level), remove, status words
- [ ] Event card: only accepted results, only with consent
- [ ] Your data: access log readable, download all my data, delete account (with confirmation)

## 3. Company
- [ ] Events: three types (in person, online, hybrid), apply with skill-check setting
- [ ] Confirm attendance only after City approval and before the deadline
- [ ] Candidate list: aliases only, best match first, decision column
- [ ] Candidate page: evidence, language, proofs, panel verdicts if present
- [ ] Decide: invite, not this time, send to City. Decision shows in the list
- [ ] Meeting booked: time, room, contact only if the jobseeker shared it
- [ ] Add a need: fill in from a website (Context.dev), edit the draft, save
- [ ] Add a need: language requirement and level save correctly
- [ ] Edit need: check mode, language, proofs, questions, anchors save
- [ ] Biased question flagged, biased anchor refused, with a readable message
- [ ] Similar needs: accept, shows as accepted

## 4. City of Espoo
- [ ] Numbers at the top match reality
- [ ] Events: approve a company, open event toggle
- [ ] Matching list: readable (top 10 + show all)
- [ ] Review queue: open, decide, item leaves the queue
- [ ] Review page: identity reveal needs a reason, is logged
- [ ] Proofs desk: verified or not valid, disappears from the list
- [ ] Testing rooms: "Use this computer" for each workstation
- [ ] Audit log: readable actions, newest first

## 5. After this list: visual refresh
Direction: closer to espoo.fi and hel.fi, keep our white and Finnish blue `#003580`, add **one light grey** (section backgrounds, cards) and **one lighter blue** (highlights, chips, hero band). Done on its own branch first.
