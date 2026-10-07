# Build & Bloom Collective: Website, Client Portal & Admin

## What lives where
- `/` Home, `/about`, `/services`, `/masterclass`, `/workshops`, `/contact`: your public website
- `/courses`: your published courses, each with its own enrollment page
- `/portal`: where clients and learners enter their access code
- `/learn/...`: a learner's course (lessons, online workbook, sessions, payments)
- `/admin`: your dashboard (clients, leads, courses, calendar, services, library, settings)

**Connected to admin:**
- Contact page inquiries show up in **Admin > Leads**. Click **Create client portal** on a lead to make their portal and a consultation sheet already filled in with their answers.
- Services and prices on the website come from **Admin > Services & add-ons**. Use **Show on website** and **Website section** on each one.
- The Workshops page comes from **Admin > Library**. Use **Show on website** and the **Date** field for events.
- Add a photo named `founder.jpg` to the `public` folder to show your headshot in the arch frames (otherwise your logo shows).

## Moving your domain from Wix
1. In Vercel: **Settings > Domains > Add** and enter `buildandbloomcollective.com` (and `www.buildandbloomcollective.com`).
2. Vercel shows the DNS records to add. In Wix: **Domains > (your domain) > Manage DNS records**. Replace the existing A record and CNAME for www with the ones Vercel gives you.
3. Wait for Vercel to show "Valid Configuration" (minutes to a few hours). Keep your Wix site until then.
4. Update your booking link in **Admin > Settings** if your current one lives on Wix, since it will stop working once the domain moves.
5. Update the Instagram link-in-bio and your email signature.

---

# Client Portal

A private proposal and member portal for each client, plus an admin dashboard where you manage everything.

**What clients get** (at your home page, using their personal access code)
- A welcome message and their package (included services, format, duration, start date)
- Their investment: line items, retainer, amount paid so far, and remaining balance
- Add-ons they can choose, then either pay for or send to you as a request
- Secure payment through Stripe (card, Apple Pay, and Klarna, Afterpay, or Affirm if you turn those on in Stripe)
- Their library: your digital products, workshop links, and files made just for them
- A "Book a session" section with your consult booking link
- Their next steps

**What you get at `/admin`**
- Clients: create a portal in seconds, fill in their package and pricing, copy a ready-to-send invite message with their code, preview their portal, see payments and add-on requests
- Services & add-ons: your core services (from your website) and add-ons with prices
- Library: digital products, workshops, and resources. Show each one to everyone or only to the clients you pick
- Settings: contact info, booking link, and default text

> The add-on prices that come with the site are **samples**. Change them in Admin > Services & add-ons before you share any portals. There is also a **Sample Client Co.** portal (code `BLOOM-DEMO`) so you can see how it looks. Delete it or change its code before you launch.

---

## Put it on Vercel (about 20 minutes)

### 1. Put the code on GitHub
1. Make a free account at github.com if you do not have one.
2. Create a new **private** repository, for example `bloom-portal`.
3. On the new repo page, click **uploading an existing file** and drag in everything from this folder. Leave out `node_modules` if it is there. Commit.

### 2. Import it to Vercel
1. At vercel.com, click **Add New > Project** and pick the `bloom-portal` repo.
2. Before you click Deploy, open **Environment Variables** and add these two:
   - `ADMIN_PASSWORD`: the password for your admin page. Make it long.
   - `SESSION_SECRET`: a long random string. Get one at https://generate-secret.vercel.app/64. **Do not change it after launch** or every access code will stop working.
3. Click **Deploy**.

### 3. Connect the database
1. In your Vercel project, open the **Storage** tab.
2. Choose **Upstash for Redis** (free plan is plenty), create it, and connect it to this project.
3. Go to **Deployments**, open the ⋯ menu on the latest deployment, and choose **Redeploy**.

Your portal is live. Visit `your-site.vercel.app/admin` and sign in.

### 4. Turn on payments (whenever you are ready)
1. In Stripe, go to **Developers > API keys** and copy the **Secret key** (starts with `sk_live_`, or `sk_test_` to practice).
2. In Vercel, go to **Settings > Environment Variables**, add `STRIPE_SECRET_KEY`, then redeploy.
3. Recommended: in Stripe, go to **Developers > Webhooks > Add endpoint**
   - URL: `https://YOUR-SITE/api/stripe/webhook`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `invoice.paid` (the last one records monthly course payments)
   - Copy the **Signing secret** into Vercel as `STRIPE_WEBHOOK_SECRET`, then redeploy.

   This makes sure a payment is recorded even if a client closes the tab before they get back to the portal.
4. To offer Klarna, Afterpay, or Affirm, turn them on in Stripe under **Settings > Payment methods**. They show up at checkout on their own.

To practice first, use your `sk_test_` key and the test card `4242 4242 4242 4242`.

### 5. Use your own domain (optional)
In Vercel, go to **Settings > Domains** and add something like `portal.buildandbloomcollective.com`. Vercel shows you the DNS record to add wherever your domain is managed (for Wix, that is Wix > Domains > DNS records).

---

## Everyday use
1. **Admin > + New client**: type their name. A code like `BLOOM-7KQ2MX` is made for them.
2. Fill in their package, investment, add-ons, library access, and next steps. Click **Save changes**.
3. Click **Preview their portal** to see what they will see.
4. Click **Copy invite message** and paste it into an email or text.
5. When they pay through Stripe, the payment shows up on their record. Add-ons they pay for or request show up under **New add-on requests** on your dashboard.
6. For payments made outside Stripe (Zelle, invoice, check), use **Record a payment** on their record.
7. When the work is done, set their status to **Completed**. Set it to **Archived** to turn their portal off.

## Sharing work with clients (Your Work section)
On each client's page in admin:
- **Progress & timeline:** add milestones with due dates and check them off. Their progress bar fills in automatically, or type a percent to set it yourself. Anything past due is flagged in red.
- **Work & deliverables:** add each thing you make (Google Doc, Sheet, Slides, website, video, content, recording) with a status (In progress, Ready for their review, Final), the date added, and an optional due date and section like "Phase 1: Strategy." Google files and YouTube, Vimeo, or Loom videos get a "Preview here" option inside the portal.
- **Shared Google Drive folder:** paste a folder link and it shows live in their portal. Drop new files in the folder and they appear without touching admin.
- **Project updates:** short dated notes that show under "Latest updates."

For previews to work, share each Google file or folder as **Anyone with the link: Viewer** (or **Commenter** if you want feedback right in the doc).

## Consultation sheets
On a client's page in admin, click **+ Start a consultation sheet** at the start of a call. It saves as you type and covers: call details, about them, goals, challenges and focus areas, budget and timing, services discussed, deliverables (check "Confirmed" as you agree), action items with who owns them, call notes, and private notes.

When you check **Show this summary in their portal**, the client sees it under "Consultation notes" (private notes never show) and can click **Confirm summary** or add anything you missed. You will see their confirmation on the sheet and in the client's sheet list. Use **Add confirmed deliverables to Your Work** to turn the agreed deliverables into items in their Your Work section.

## Courses
**Admin > Courses** holds every course. Your workbook **Rooted in Many Streams** is already loaded as a **draft**, with all 7 modules, 20 lessons, its questions, tables, checklists, affirmations and welcome letter.

Each course has these tabs:
- **Overview**: title, format (self-paced, virtual, in person, hybrid), status, suggested pace, welcome letter, affirmations, and switches for the printable workbook and certificate.
- **Curriculum**: modules and lessons. Each lesson has teaching text, an optional video link, a download link, a callout, and workbook questions (short answer, long answer, table, checklist, or 1 to 10 scale).
- **Packages & payments**: what people can buy. Each package sets its price (or monthly price), how many 1:1 sessions it includes and how long they are, and which payment plans it allows. Add-ons (like an extra session) and discount codes live here too.
- **Resources**: downloads and links, plus items from your Library.
- **Schedule**: class dates for virtual or in-person courses. These show on learners' dashboards and your calendar.
- **Learners**: everyone enrolled, their progress bar, sessions used, and what they have paid. Enroll someone yourself here (paid another way, payment plan, scholarship, or an existing client).

To open a course for enrollment: set **Status** to **Published**, check **List on the website's Courses page**, and save.

**How enrolling works.** On the course page, people pick a package, a payment plan, add-ons, and pay through Stripe. Their course opens right away and their access code is shown on the welcome screen (no email is sent, so they should save it). If they already have a portal with that email, the course is added to it. Until Stripe is connected, the enroll button saves them as a Lead instead.

**Payment plans.** The first payment is charged at checkout. Learners see what is due next on their dashboard and pay it with one click. Monthly packages bill automatically through Stripe. You can record payments made another way on the learner's page.

**1:1 sessions.** Learners see how many sessions they have left and click **Request a session** with times that work. The request shows on the learner's page and in **Calendar**. Click **Schedule**, and the session is added to both calendars and counted as used.

**Learner view.** Open any learner and click **View as learner** to see exactly what they see.

## Booking
Every **Book** button on the website, the client portal, and course pages opens your own booking page at `/book`. No outside booking tool is needed.

**Set it up once:** go to **Admin > Settings > Booking & availability** and set:
- your weekly hours (Eastern Time; add a second block for evening hours)
- consult length, session length, the break between bookings, minimum notice, and how far ahead people can book
- your Zoom or Google Meet link, so people get it the moment they book
- days off

**What happens when someone books:**
- **Free consult (anyone):** it goes on your Calendar and into **Leads** with a "Consult" date. If they already sent an inquiry, the booking attaches to that same lead.
- **Course learners:** they click **Book a time** on their course. It uses their package's session length and counts toward their included sessions. When they run out, the page tells them to reach out.
- **Clients:** **Pick a time** in their portal books a session tied to their client record. Their upcoming sessions show in the portal.

Everyone gets a confirmation page with **Add to my calendar**, **Reschedule**, and **Cancel**. Cancelling frees the time and gives a learner their session back. Anything with a time on your Calendar (and course class dates) blocks those times automatically, so add other commitments to your Calendar. For a whole day off, add an appointment with Type **Other** and check **Day off**, or use Days off in Settings.

Bookings don't read your Google Calendar. Subscribe to this calendar on your phone (below) so bookings show up there, and add personal commitments here to keep those times closed.

## Content calendar

**Admin > Content** holds your Instagram and YouTube plan. It comes loaded with six weeks of posts starting Monday, October 5, 2026, plus a set of unscheduled ideas. Every post already has its graphic or video, caption, hashtags and keywords.

- **Schedule** lists posts week by week. **Month** shows them on a calendar. **Ideas** holds posts with no date yet.
- Open a post to **Save** its files and **Copy** its caption. On a phone, tap Save, or open the file and press and hold it to save it to Photos.
- Change a post's status to **Posted** once it's up. Posted posts drop off your main Calendar.
- **Move dates** shifts every post that isn't posted yet, from a date onward. Use it if a launch moves or you take a week off.
- **+ New post** adds your own. Upload images or videos right on the post (this uses the same Blob storage as the Wellness Library).
- Dashed posts are **face content** slots, saved for you on camera.
- The graphics and reels that come with the site live in `public/content`.

## Wellness Library
**Admin > Wellness Library** holds every piece: guided audio, soundscapes, journaling, coping tools, readings, and team tools.

- **Edit or add pieces** without touching code. Each piece has its text, private reflection questions, and optional audio or video.
- **Upload audio and video** right in the piece editor (see the one-time setup below). You can also paste a link instead.
- **Members tab:** give founding members access. New people get a client portal and an access code; the library shows up as a card in their portal.
- **Members' reflections are private.** Nothing in admin shows what anyone writes.

### One-time setup for uploads (about 3 minutes)
1. In Vercel, open your project and click **Storage**.
2. Click **Create** (or **Create Database**), choose **Blob**, and set access to **Public**. Name it something like "library-media".
3. Connect it to this project for **Production** and **Preview**.
4. Vercel adds `BLOB_READ_WRITE_TOKEN` for you. Redeploy once (Deployments > the latest one > Redeploy).

Uploaded files get a long random web address. Anyone with that exact link could open the file, so treat it like an unlisted video.

## Calendar
**Admin > Calendar** shows your appointments, course class dates, client milestones and deliverable due dates, dated workshops from your Library, and payment plan due dates. Click a day to add an appointment. On a phone it switches to a list.

**See it on your phone:** click **Copy calendar link**, then in Google Calendar choose Other calendars > From URL and paste it (on iPhone: Settings > Calendar > Accounts > Add Subscribed Calendar). Keep this link private. Learners can add their own sessions and class dates with the **Add to my calendar** button.

## Your logo
`public/logo.png` is cropped from a screenshot. Replace it with your original logo file, using the same name, for a sharper look.

## Running it on your own computer (optional)
Install Node.js 20 or newer, then in this folder run `npm install` and then `npm run dev`. Open http://localhost:3000. The admin password on your computer is `bloom-admin`. Without Redis, data is saved to a `.data` folder.

## Strategy plans and the wellness assessment

Both live on each client's page in admin, in the **Workspace** box (top right).

**Strategy plan** (Clients > a client > Open strategy plan)
- Click a starter template or build your own: sessions with a goal, agenda, notes, decisions and resources, plus tasks for you and for the client.
- Each task has an owner, a due date, a status and an optional link to a service, course, Library item, Wellness Library piece, the assessment, or any web address.
- Turn on "Show this plan in their portal". The client sees progress bars (overall, theirs, yours), checks off their own tasks, edits their own tasks, comments on any task, adds agenda items, and sends a change request on your tasks, a session, or the whole plan.
- Change requests and new comments show at the top of the plan and in the Workspace box. Reply and mark resolved.
- Dated sessions and your own dated tasks show on Admin > Calendar.

**Organizational Wellness Assessment** (Clients > a client > Set up assessment)
1. Turn it on. The leader questionnaire appears in their portal, pre-filled from their inquiry form when there is one. It includes an operations snapshot: workload by role, typical hours, scheduling, coverage, friction workflows, and tools.
2. They get an anonymous survey link for their team. No names or emails are collected.
3. Move the stage to "Closed for review" when you are ready. Only you see results until you share.
4. Write your summary and recommendations. Give each one a priority (Now, Next, Later). The list sorts itself in that order when you save, and the client sees it as their prioritized action plan. "Add to plan" turns a recommendation into a task on their strategy plan.
5. Click "Share results with client". They see scores for seven areas, your findings, recommendations, and matching services and Wellness Library pieces.

Role breakdowns are hidden for any group with fewer than 3 responses. Team comments stay private unless you check "Include these comments in the client's results". To change the questions, edit `lib/assessment-def.ts`.

## Guidebooks and leads

- Public page: `/guides` (also linked in the site menu and footer). Each guide has its own page, for example `/guides/starter-guide`. Share that link on Instagram.
- Anyone who requests a guide gives their name and email and shows up in **Admin > Leads** with a gold "Guide" tag. If the same email requests another guide or later sends an inquiry form, check Leads for both.
- Clients see every guidebook in their portal under "Your guidebooks", no form needed.
- To change a guide, replace its PDF in `public/guides` (keep the same file name).
- To sell a guide instead of giving it away, open `lib/guides.ts` and set its `price` (in dollars). Buyers then pay through Stripe before the download, and the lead shows "paid". The PDF link itself is not locked, so anyone a buyer forwards it to can open it.
- To add a guide, add the PDF to `public/guides` and copy one of the entries in `lib/guides.ts`.

## Pricing by client type

- Every service has two prices in **Admin > Services & add-ons**: Small business and Organization. Leave Organization blank to use the same price for both.
- Core service prices stay off the website (it says "Priced at your free consult") unless you check "Show price on website". A la carte services show both prices.
- On a **consultation sheet**, click Small business or Organization first. That sets the extra questions and the suggested prices. Check services as you talk, change any price or quantity, add an adjustment, and the starting price totals itself.
- "Use as their proposal" copies the services, line items, and total to the client page. Review it there before you send their code.
- "Show this starting price in the summary they see" adds it to the consult summary in their portal.
- The client type on the client page decides which a la carte prices they see and pay in their portal.

## The conflict workshop (Hard Conversations, Handled with Care)

- It loads once as a **draft course** in Admin > Courses. It has 8 parts and 18 lessons, each with teaching text, a room activity, a solo version, discussion questions, and workbook exercises.
- To give someone the workbook: open the course, go to Learners, and enroll them with the "Workshop participant" package (free). If they are a client, it shows in their portal under Courses. Their answers save as they type, and you can read them from the learner's page.
- To sell it on its own, add a priced package and set the course to Published and "Show on website".
- **Media on any lesson:** paste a YouTube, Vimeo, Loom, or Drive link, or use "Upload a video or audio file". Uploaded files play right on the lesson page. "Upload a download" attaches a PDF or image.
- The workshop's Instagram campaign (12 posts, November 16 to December 4) loads into Admin > Content with its graphics attached. The free Hard Conversation Planner is at `/guides/conversation-planner`.

## Meeting view and strategy sessions

- **Meeting view:** on the Clients list, click "Meeting view" under a client's name (or "Open meeting view" on their page). It is one page with the session form, open items, progress, what is waiting on you, payments, assessment, courses, consult notes, and private notes.
- **New session:** pick the date and click "+ New session" each time you meet. Open items from the last session carry forward and the last session is marked complete. Uncheck the box to start clean.
- **Status of things:** each item is Not started, In progress, or Completed, and belongs to you or the client. Everything in the session form saves on its own and shows in the client's portal under their strategy plan, newest session first. Private notes never show.
- **Existing clients who do not pay through the site:** when you create the client, check "Existing client, no payment needed". For a client you already made, set Payment to "No payment needed" on their client page. Their portal then has no investment or payment sections.

## The strategy room (live sessions)

- **Open it:** in a client's Meeting view, click "Open strategy room" on the session. The client opens the same room from their portal ("Open the strategy room" on their workspace box or strategy plan).
- **Live:** what either of you types shows on the other screen in about two seconds. A green dot shows when the other person is in the room, and a box is outlined while they are typing in it. If you both type in the same box at the same moment, the last edit wins, so take turns inside one box.
- **Nine steps:** Check-in (wins, what feels heavy, scorecard), Focus, Brainstorm (idea notes with voting), Mind map, Evaluate (impact and effort), Canvases, Roadmap and action items, Decisions, Recap.
- **Carry-forward:** a new session's room starts with last session's open ideas, parking lot, and scorecard (with last time's numbers filled in).
- **Recap:** "Save recap to their plan" copies the focus, decisions, and notes to the session on their strategy plan. "Close session" also locks the room for the client. "Print or save as PDF" makes a copy to send.
- **Private notes** on the Decisions step are only ever sent to you.
- The room checks for changes every second and a half while it is open, which uses your database's request allowance faster than the rest of the site. Close the tab when the session ends.

## Scheduling, calendar, and meeting invites

- **On each session** (Meeting view): set the date, time, length, and a Zoom or Google Meet link. "Add to my calendar" downloads the event for your own calendar. Sessions with a date also show on Admin > Calendar.
- **Schedule the next session** from the Meeting view, or from the Recap step in the strategy room before the client leaves.
- **What the client gets in their portal:** the date and time, "Add to my calendar", and "Join the call", on their workspace box, strategy plan, and inside the strategy room.
- **Copy invite message** gives you a ready-to-paste note with the time, the call link, and their strategy room link. This works with no setup.
- All times are Eastern.

### Turning on email invites (one-time setup)

Email invites send the client a real calendar invitation with Yes and No buttons. They need an email sending service. The site is built for Resend, which has a free plan.

1. Create an account at resend.com.
2. In Resend, add your domain and add the DNS records it shows you wherever your domain is managed. Wait until Resend marks the domain verified.
3. In Resend, create an API key and copy it.
4. In Vercel, open your project > Settings > Environment Variables and add:
   - `RESEND_API_KEY` = the key you copied
   - `EMAIL_FROM` = `Build & Bloom Collective <hello@yourdomain.com>` (use an address on the domain you verified)
5. Redeploy. The "Email calendar invite" button on each session turns on.

Replies go to the email address in Admin > Settings. Sending the invite again after changing the time updates the same event on their calendar instead of adding a second one.

## Agreements, files, alerts, reminders, reviews, and backup

**Agreements.** Open a client's Meeting view, then Agreements. "New agreement" starts from a template you can edit. "Save and send" puts it at the top of their portal. They type their full name and check a box to sign. You get their name, title, date and time, and a locked copy of the exact text. Check "Must be signed before they can pay by card" to hold online payment until it is signed. A signed agreement cannot be edited. The template is a starting point, not legal advice: have a lawyer review it.

**Shared files.** Clients upload documents in the Files section of their portal (PDF, Word, Excel, PowerPoint, images, text, up to 50 MB each). You upload and remove files from the Shared files box on the Meeting view. This uses the same Blob store as course media. File links are long and unguessable but not password protected, so do not use this for records with protected health information.

**Alerts to you.** Once email is set up (see Scheduling above), you get an email when a client signs an agreement, uploads a file, comments on a task, sends a change request, submits the leader questionnaire, confirms a consult summary, asks about add-ons, or pays by card, and when someone books, sends an inquiry, or requests a guide. Alerts go to the email in Settings. To send them somewhere else, add `NOTIFY_EMAIL` in Vercel.

**Session reminders.** Clients get an email the day before a strategy session with the time, call link, and their open tasks. To turn this on:
1. In Vercel, Settings, Environment Variables, add `CRON_SECRET` with any long random text (30 or more letters and numbers).
2. Redeploy. The `vercel.json` file in this project tells Vercel to run the reminder check once a day at 9 AM Eastern (8 AM in winter).
The client needs an email on their client page, and the session needs a date. Each session is reminded once.

**Scorecard over time.** The numbers you enter on the Scorecard tab of each strategy room are charted across sessions on the client's plan page and on your Meeting view. Keep the measure names the same from session to session so they line up.

**Progress review.** On the Meeting view, click "Progress review". Pick the dates (it starts at the last 90 days), write "Where things stand" and "What comes next", then print it, or share it to their portal. It pulls sessions, wins, decisions, completed tasks, open tasks, and the scorecard. Tasks completed before this update have no completion date and are not counted.

**Backup.** Admin, Settings, "Download full backup" gives you one file with everything in the portal. Save one about once a month. The link at the bottom of a Meeting view downloads one client only. Access codes are not included, and uploaded files are listed by link, not copied.

## Proposals

Open a client's Meeting view and click the Proposal link in the "Proposal and agreements" box (or the proposal tag on your client list).

1. **Build it.** Option 1 is filled in from the client page, so after "Use as their proposal" on a consult sheet it is already there. Add an opening note and, if you want a deadline, a "Good through" date.
2. **One option or several.** One option is a simple yes. Add up to four to show them side by side, and mark one as recommended. Check services, click "Add price lines for the checked services" to pull in your suggested prices for their client type, then adjust. A negative price line shows as a discount.
3. **Send.** "Save and send" puts a "Your proposal is ready" card at the top of their portal. While it is waiting, the package, investment, and pay sections are hidden and card payment is held, so they only see prices on the proposal.
4. **They accept.** They pick an option, type their name, and accept. That option becomes their package and investment, their status becomes active, you get an email, and they are walked to the next steps: sign the agreement (if you sent one), pay the retainer, kickoff.
5. **Track it.** Your client list shows Proposal draft, sent, viewed, accepted, or expired.

To change an accepted proposal, click "Revise". That clears their acceptance and they accept the new version. They can print or save the proposal as a PDF at any point, for a board or finance person.

## Custom portals and systems (the service you sell)

- **The page** is at `/systems`, linked in the top menu and from a banner on the Services page. The sample screens are in `public/systems` and show a made-up business.
- **The services** were added to Admin, Services: Landing Page Build, Proposal and Payment Portal, Full Operations Hub, and the Systems Care Plan add-on, each with a small business and organization price. Change prices there. The three builds say "Priced at your consult" on the site until you check "show price" for them. The care plan shows its price like your other add-ons.
- **Instagram posts** for the launch are on the Content calendar from December 7 to 18 under the campaign "Systems builds". Two are yours to record (a face video and a screen recording). Use the Sample Client for the screen recording, never a real client.

## Build workspace (intake, progress, and add-ons for systems clients)

Open a client's Meeting view and click "Systems build" in the "Proposal and agreements" box.

1. **Turn it on.** Check "Show the build workspace in their portal" and pick what you are building. The questionnaire adjusts: a landing page skips the admin and client-portal questions.
2. **Gather the information.** The questionnaire covers their business, brand (with color pickers), links, website, admin side, client side, and timing. They fill it in from their portal and it saves as they type, or click "Fill in or edit" and complete it with them during the consultation. "Read answers" gives you a clean view you can print.
3. **Files.** Logo, photos, and brand files go in the Shared files box on the same page (needs the Blob store).
4. **Accounts in their name.** A checklist with what each costs: domain, GitHub, Vercel Pro ($20 a month), Claude Pro ($20 a month), Stripe, and email sending. These are paid by the client directly, about $40 a month, and are shown on the Systems page and the overview PDF. If Vercel or Claude change their prices, update `ACCOUNTS` and `RUNNING_COSTS` in `lib/build-def.ts` and the wording on `app/(site)/systems/page.tsx`.
5. **Keep them posted.** Change the stage (Discovery, Design, Build, Your review, Launch), set a target date, add a preview link, and post short updates. They see all of it on their build page.
6. **Add-on requests.** Clients pick from the build add-ons (Admin, Services, the ones that start with a build name such as Online booking or Staff logins) or describe something else. You get an email, reply with a price and timing, and set the status. Requesting never charges them. Add the agreed amount to their proposal or record it as a payment line yourself.

## How the client portal home is laid out

The portal home is built to show a client one clear next step, not everything at once.

- **Top: "what needs you."** Only things waiting on them: accept the proposal, sign an agreement, pay the retainer, confirm a consult summary, finish a questionnaire, tasks due in the next two weeks. If nothing is waiting it says they are caught up. Next to it is their next session with the call link.
- **Then the work:** sessions and plan, build, progress review, courses, files, booking.
- **Lower down:** package, investment, and payment. Then workshops and resources (collapsed until they open it) and guidebooks.
- **"Here is how we begin"** shows only until the client is active.
- **Menu:** Sessions, Files, Book, Billing, plus Build, Proposal, or Courses only when they apply.
- **Guidebooks:** each client sees only the client guidebook unless you check others in "Guidebooks in their portal" on their Meeting view.

## Automatic client contracts

When a client becomes active, a Client Services Agreement is written for them and placed in their portal to sign. "Becomes active" means any of these: they accept a proposal, they make a first payment (card, or a Zelle payment you confirm), you change their status to active, or you add them with "Existing client, no payment needed".

- **What gets filled in:** their name, the date, their services, their total, retainer, and price lines, plus extra terms that match their services (strategy sessions, operations support, the assessment, workshops, events, systems builds). A client set to "no payment needed" gets a line saying fees are billed as already agreed.
- **Settings, Client contracts:** choose "Send it automatically", "Draft it for me to review", or "Off". Choose whether card and Zelle payment waits for a signature, set the governing state, and read or edit the template.
- **It stays in step until it is signed.** When you change a client's services, custom items, format, length, or pricing, any unsigned agreement is rewritten to match. If the client has it open, they are asked to refresh before signing. An agreement whose wording you edited by hand is left alone; use "Rewrite it from their client page now" on that agreement to bring it back in step.
- **Signed agreements never change.** If their services or pricing change after signing, their Agreements page and Meeting view tell you, and "New agreement" writes an updated one for them to sign.
- **One per client.** A client who already has any agreement is never sent a second one automatically. To make another, use New agreement on their Agreements page.
- **Clients who were already active before this update** do not get one automatically. Open their Agreements page and click New agreement.
- **The extra terms for each service** live in `lib/contract-def.ts` under `SERVICE_TERMS`.
- Have a lawyer licensed in your state review the template once before you rely on it.

## Zelle payments

Clients can choose Card or Zelle in the pay section of their portal. With Zelle they see the amount, where to send it, and a button to tell you they sent it.

- You get an email, and the notice shows under "Waiting on you" on their Meeting view.
- **Nothing counts as paid until you click "It arrived".** Check your bank first. You can correct the amount if what arrived is different.
- Set or change your Zelle number and the name clients will see under Settings, Zelle payments. Empty the first box to turn Zelle off.
