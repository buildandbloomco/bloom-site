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
