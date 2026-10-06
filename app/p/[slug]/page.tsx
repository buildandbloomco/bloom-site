import "@/components/portal-nav.css";
import "@/components/portal/workspace.css";
import { pricedFor } from "@/lib/tier";
import WorkspaceHub from "@/components/portal/WorkspaceHub";
import { GUIDES } from "@/lib/guides";
import { getAssessment, getPlan } from "@/lib/workspace";
import { bookProps, fmtTime, longDate, nowET } from "@/lib/booking";
import { redirect } from "next/navigation";
import { currentClient } from "@/lib/auth";
import { amountPaid, getCatalog, getClient, getSettings, toPublic } from "@/lib/data";
import { money, shortDate } from "@/lib/format";
import { outstanding } from "@/lib/pricing";
import { recordCheckoutSession, stripe } from "@/lib/stripe";
import AddOnsAndPay from "@/components/AddOnsAndPay";
import SignOut from "@/components/SignOut";
import Ribbon from "@/components/Ribbon";
import YourWork, { hasWork } from "@/components/YourWork";
import ConsultSummary from "@/components/ConsultSummary";
import SharedFiles from "@/components/SharedFiles";
import { listAgreements } from "@/lib/agreements";
import { listFiles } from "@/lib/files";
import { getProposal } from "@/lib/proposals";
import { isExpired } from "@/lib/proposal-def";
import { getBuild } from "@/lib/builds";
import { BUILD_KINDS, STAGES, intakeProgress } from "@/lib/build-def";
import { getReview } from "@/lib/reviews";
import MyCourses from "@/components/course/MyCourses";
import { getAccess } from "@/lib/library";
import { getCourse, listAppointments, listEnrollments } from "@/lib/courses";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your Portal", robots: { index: false, follow: false } };

export default async function Portal({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ paid?: string; canceled?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  let client = await currentClient();
  if (!client || client.slug !== slug || client.status === "archived") redirect("/portal");

  // Coming back from Stripe: confirm and record the payment right away (webhook also does this)
  let paidBanner = false;
  if (sp.paid && sp.paid.startsWith("cs_")) {
    const s = stripe();
    if (s) {
      try {
        const session = await s.checkout.sessions.retrieve(sp.paid);
        if (session.metadata?.clientId === client.id) {
          paidBanner = await recordCheckoutSession(session);
          client = (await getClient(client.id)) ?? client;
        }
      } catch {
        /* ignore: webhook will catch it */
      }
    }
  }

  const [catalog, settings, allAppts] = await Promise.all([getCatalog(), getSettings(), listAppointments()]);
  const today = nowET().date;
  const myAppts = allAppts.filter((x) => x.clientId === client.id && !x.enrollmentId && x.date >= today).sort((x, y) => (x.date + x.start).localeCompare(y.date + y.start)).slice(0, 5);
  const pub = toPublic(client);
  const services = pricedFor(catalog.services, client.tier);
  const included = client.package.serviceIds
    .map((id) => services.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s);
  const addOns = services.filter((s) => s.kind === "addon" && s.active && client.addOnIds.includes(s.id));
  const library = catalog.library.filter(
    (l) => l.active && (l.audience === "all" || client.libraryIds.includes(l.id))
  );
  const workshops = library.filter((l) => l.kind === "workshop");
  const products = library.filter((l) => l.kind !== "workshop");
  const paid = amountPaid(client);
  const owe = outstanding(client.investment, paid);
  const noPay = client.billing === "none";
  const holdPay = (await getProposal(client.id))?.status === "sent";
  const hasInvestment = client.investment.total > 0 && !noPay && !holdPay;
  const first = client.contactName || client.name;

  const showWork = hasWork(pub);
  const myCourses = (
    await Promise.all(
      (await listEnrollments({ clientId: client.id }))
        .filter((e) => e.status !== "paused")
        .map(async (e) => ({ e, c: await getCourse(e.courseId) }))
    )
  ).filter((x): x is { e: typeof x.e; c: NonNullable<typeof x.c> } => !!x.c);
  const libAccess = await getAccess(client.id);
  const hasLibrary = libAccess?.status === "active";
  const [plan, assessment] = await Promise.all([getPlan(client.id), getAssessment(client.id)]);
  const hasWorkspace = !!plan.enabled || !!assessment?.enabled;
  const [agreements, files, review] = await Promise.all([listAgreements(client.id), listFiles(client.id), getReview(client.id)]);
  const myAgreements = agreements.filter((a) => a.status !== "draft");
  const toSign = myAgreements.filter((a) => a.status === "sent");
  const proposal = await getProposal(client.id);
  const build = await getBuild(client.id);
  // While a proposal is waiting for an answer, the price lives on the proposal page, not here
  const proposalOpen = proposal?.status === "sent";
  const nav = [
    build.enabled ? ["Your build", `/p/${slug}/build`] : null,
    hasWorkspace ? ["Workspace", "#workspace"] : null,
    myCourses.length ? ["Courses", "#courses"] : null,
    showWork ? ["Your work", "#work"] : null,
    pub.consults.length ? ["Consult notes", "#consult"] : null,
    holdPay ? ["Your proposal", `/p/${slug}/proposal`] : ["Your package", "#package"],
    hasInvestment ? ["Investment", "#investment"] : null,
    addOns.length && !noPay && !holdPay ? ["Add-ons", "#addons"] : null,
    noPay || holdPay ? null : ["Pay", "#pay"],
    library.length ? ["Library", "#library"] : null,
    ["Files", "#files"],
    client.showBooking ? ["Book a session", "#book"] : null,
    ["Next steps", "#next"],
  ].filter(Boolean) as [string, string][];

  return (
    <>
      <Ribbon />
      <header className="topbar">
        <div className="wrap">
          <a href="#top" className="brandmark" style={{ textDecoration: "none", color: "inherit" }}>
            <img src="/logo.png" alt="" style={{ width: 40, height: 44 }} />
            <span>{settings.brandName.toUpperCase()}</span>
          </a>
          <nav className="topnav" aria-label="Sections">
            {nav.map(([label, href]) => (
              <a key={href} href={href}>{label}</a>
            ))}
          </nav>
          <div className="row" style={{ gap: 10, flexWrap: "nowrap" }}>
            <a href="/" className="btn btn-sm btn-ghost">Website</a>
            <SignOut />
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              <p className="eyebrow">Prepared for {client.name}</p>
              <h1 style={{ marginTop: 16 }}>
                {client.package.title || "Your proposal"}
              </h1>
              <span className="rule" aria-hidden="true" />
              <div className="boxed lede">
                <p>
                  {client.welcome ||
                    `Welcome, ${first}. Everything for our work together lives here: your package, investment, add-ons, resources, and next steps.`}
                </p>
              </div>
              <div className="row cta">
                {hasWorkspace ? (
                  <a className="btn btn-primary" href="#workspace">Open your workspace</a>
                ) : showWork ? (
                  <a className="btn btn-primary" href="#work">View your work</a>
                ) : (
                  holdPay ? <a className="btn btn-primary" href="#next">Next steps</a> : <a className="btn btn-primary" href="#package">Explore your package</a>
                )}
                {holdPay ? <a className="btn btn-ghost" href={`/p/${slug}/proposal`}>Review your proposal</a> : noPay ? <a className="btn btn-ghost" href="#next">Next steps</a> : <a className="btn btn-ghost" href="#pay">Pay your part</a>}
              </div>
            </div>
            <div className="arch-frame" aria-hidden="true">
              <div className="back" />
              <div className="front">
                <img src="/logo.png" alt="" />
              </div>
              <span className="pill">{first}</span>
            </div>
          </div>
        </section>

        {proposalOpen && proposal && (
          <section className="section" style={{ paddingBottom: 0 }}>
            <div className="wrap">
              <div className="dark-card row between" style={{ gap: 20, flexWrap: "wrap" }}>
                <div className="stack" style={{ gap: 6, maxWidth: 640 }}>
                  <span className="eyebrow gold">Your proposal is ready</span>
                  <p style={{ margin: 0, color: "var(--on-dark-2)" }}>
                    {isExpired(proposal, today) ? "This proposal has expired. Reach out and we will send an updated one." : proposal.options.length > 1 ? `${proposal.options.length} ways we can work together. Review them and choose the one that fits.` : "Review what is included and the investment, then accept to get started."}
                    {proposal.expires && !isExpired(proposal, today) ? ` Good through ${longDate(proposal.expires)}.` : ""}
                  </p>
                </div>
                <a className="btn btn-gold" href={`/p/${slug}/proposal`}>Review your proposal</a>
              </div>
            </div>
          </section>
        )}

        {toSign.length > 0 && !proposalOpen && (
          <section className="section" style={{ paddingBottom: 0 }}>
            <div className="wrap">
              <div className="banner warn row between" style={{ margin: 0, gap: 14, flexWrap: "wrap" }}>
                <span><strong>Please sign: {toSign.map((a) => a.title).join(", ")}.</strong>{toSign.some((a) => a.requiredToPay) && !noPay ? " This needs your signature before you can pay online." : " It takes about two minutes."}</span>
                <a className="btn btn-sm btn-dark" href={`/p/${slug}/agreements/${toSign[0].id}`}>Read and sign</a>
              </div>
            </div>
          </section>
        )}

        <WorkspaceHub slug={slug} plan={plan} assessment={assessment} today={today} />

        {build.enabled && (
          <section className="section" style={{ paddingBottom: 0 }} id="build">
            <div className="wrap">
              <div className="ws-card" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                <div className="stack" style={{ gap: 4, maxWidth: 640 }}>
                  <span className="eyebrow">Your build · {STAGES.find((s) => s.id === build.stage)?.label}</span>
                  <h3>{BUILD_KINDS.find((k) => k.id === build.kind)?.label}</h3>
                  <p className="small" style={{ margin: 0 }}>{build.updates[0] ? build.updates[0].text.slice(0, 160) : "Follow progress, send us your brand and details, and request add-ons."}{!build.intakeSubmittedAt ? ` Your questionnaire is ${intakeProgress(build).percent}% done.` : ""}</p>
                </div>
                <a className="btn btn-sm btn-dark" href={`/p/${slug}/build`}>{build.intakeSubmittedAt ? "Open your build" : "Continue your questionnaire"}</a>
              </div>
            </div>
          </section>
        )}

        {review?.sharedAt && (
          <section className="section" style={{ paddingBottom: 0 }}>
            <div className="wrap">
              <div className="ws-card" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                <div className="stack" style={{ gap: 4 }}>
                  <h3>Your progress review</h3>
                  <p className="small" style={{ margin: 0 }}>{shortDate(review.from)} to {shortDate(review.to)}: what we did, what moved, and what comes next.</p>
                </div>
                <a className="btn btn-sm btn-dark" href={`/p/${slug}/review`}>Open the review</a>
              </div>
            </div>
          </section>
        )}

        <section className="section" id="guidebooks" style={{ paddingBottom: 0 }}>
          <div className="wrap stack" style={{ gap: 16 }}>
            <p className="eyebrow">Your guidebooks</p>
            <div className="ws-hub" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
              {[...GUIDES].sort((a, b) => (a.slug === "client-guidebook" ? -1 : b.slug === "client-guidebook" ? 1 : 0)).map((g) => (
                <div className="ws-card" key={g.slug}>
                  <h3>{g.title}</h3>
                  <p className="small" style={{ margin: 0 }}>{g.tagline}</p>
                  <a className="btn btn-sm btn-dark" style={{ alignSelf: "flex-start" }} href={g.file} target="_blank" rel="noopener noreferrer">Open the guidebook (PDF)</a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {hasLibrary && (
          <section className="section" id="wellness-library" style={{ paddingBottom: 0 }}>
            <div className="wrap">
              <div className="dark-card row between" style={{ gap: 20 }}>
                <div className="stack" style={{ gap: 8, maxWidth: 620 }}>
                  <span className="eyebrow gold">Your membership</span>
                  <h2 style={{ color: "var(--gold)", textTransform: "none", letterSpacing: 0, margin: 0 }}>The Wellness Library</h2>
                  <p style={{ margin: 0, color: "var(--on-dark-2)" }}>Guided audio, journaling, coping tools, and readings. Your reflections are private to you.</p>
                </div>
                <a className="btn btn-gold" href="/library">Open the library</a>
              </div>
            </div>
          </section>
        )}
        {myCourses.length > 0 && <MyCourses items={myCourses} />}

        {showWork && <YourWork client={pub} />}

        {pub.consults.length > 0 && (
          <ConsultSummary consults={pub.consults} services={catalog.services} contactName={client.contactName} />
        )}

        {/* PACKAGE */}
        {!holdPay && <section className="section" id="package">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">Your package</p>
              <h2>What we are building together</h2>
              {client.package.summary && <p className="muted">{client.package.summary}</p>}
              {proposal?.status === "accepted" && <p className="small" style={{ margin: 0 }}><a href={`/p/${slug}/proposal`}>View your accepted proposal</a></p>}
            </div>
            {(client.package.format || client.package.duration || client.package.startDate) && (
              <div className="stats" style={{ marginBottom: 32 }}>
                <div><div className="k">Format</div><div className="v">{client.package.format || "To confirm"}</div></div>
                <div><div className="k">Duration</div><div className="v">{client.package.duration || "To confirm"}</div></div>
                <div><div className="k">Start date</div><div className="v">{shortDate(client.package.startDate) || "To confirm"}</div></div>
              </div>
            )}
            <div className="grid-2">
              {included.map((s) => (
                <article className="card" key={s.id}>
                  <span className="tag green">Included</span>
                  <h3 style={{ marginTop: 14 }}>{s.name}</h3>
                  <p className="muted">{s.description}</p>
                </article>
              ))}
              {client.package.customItems.map((i, n) => (
                <article className="card" key={`c${n}`}>
                  <span className="tag green">Included</span>
                  <h3 style={{ marginTop: 14 }}>{i.title}</h3>
                  {i.detail && <p className="muted">{i.detail}</p>}
                </article>
              ))}
              {!included.length && !client.package.customItems.length && (
                <p className="muted">Your package details are being finalized. Check back soon, or book a call below.</p>
              )}
            </div>
          </div>
        </section>}

        {/* INVESTMENT */}
        {hasInvestment && (
          <section className="section alt" id="investment">
            <div className="wrap">
              <div className="section-head">
                <p className="eyebrow">Your investment</p>
                <h2>Clear numbers, no surprises</h2>
              </div>
              <div className="invest">
                <div className="card">
                  <ul className="lines">
                    {client.investment.lineItems.map((l, i) => (
                      <li key={i}><span>{l.label}</span><strong>{money(l.amount)}</strong></li>
                    ))}
                    <li>
                      <span className="choice-title" style={{ alignSelf: "center" }}>Package total</span>
                      <span className="big-number" style={{ fontSize: "1.9rem", color: "var(--rust)" }}>{money(client.investment.total)}</span>
                    </li>
                  </ul>
                  {client.investment.note && <p className="muted small" style={{ marginTop: 12 }}>{client.investment.note}</p>}
                </div>
                <div className="dark-card">
                  <ul className="lines">
                    {client.investment.retainer > 0 && (
                      <li><span>Retainer to begin</span><strong>{money(client.investment.retainer)}</strong></li>
                    )}
                    <li><span>Paid so far</span><strong>{money(paid)}</strong></li>
                    <li>
                      <span>Remaining balance</span>
                      <span className="big-number" style={{ fontSize: "1.8rem", color: "var(--gold)" }}>{money(owe)}</span>
                    </li>
                  </ul>
                  <a className="btn btn-gold btn-block" href="#pay" style={{ marginTop: 18 }}>
                    {owe > 0 ? "Pay your part" : "Paid in full. Thank you!"}
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {!noPay && !holdPay && <AddOnsAndPay
          client={pub}
          addOns={addOns}
          paid={paid}
          paidBanner={paidBanner}
          canceled={!!sp.canceled}
          paymentsOn={!!process.env.STRIPE_SECRET_KEY}
          beforeYouBook={settings.beforeYouBook}
          email={settings.email}
        />}

        {/* LIBRARY */}
        {library.length > 0 && (
          <section className="section alt" id="library">
            <div className="wrap">
              <div className="section-head">
                <p className="eyebrow">Your library</p>
                <h2>Workshops, tools, and resources</h2>
                <p className="muted">Everything you have access to, in one place. Bookmark this page.</p>
              </div>
              <div className="stack" style={{ gap: 40 }}>
                {workshops.length > 0 && (
                  <div className="stack">
                    <h3>Workshops & trainings</h3>
                    <div className="grid-3">
                      {workshops.map((l) => (
                        <article className="card lib-card" key={l.id}>
                          <span className="tag rust">Workshop</span>
                          <h3 style={{ fontSize: "1.15rem" }}>{l.title}</h3>
                          <p className="muted small">{l.description}</p>
                          <div className="foot">
                            <span className="small"><strong>{l.priceLabel}</strong></span>
                            <a className="btn btn-dark btn-sm" href={l.url} target="_blank" rel="noopener noreferrer">View</a>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
                {products.length > 0 && (
                  <div className="stack">
                    <h3>Digital products & tools</h3>
                    <div className="grid-3">
                      {products.map((l) => (
                        <article className="card lib-card" key={l.id}>
                          <span className="tag">{l.kind === "product" ? "Digital product" : "Resource"}</span>
                          <h3 style={{ fontSize: "1.15rem" }}>{l.title}</h3>
                          <p className="muted small">{l.description}</p>
                          <div className="foot">
                            <span className="small"><strong>{l.priceLabel}</strong></span>
                            <a className="btn btn-dark btn-sm" href={l.url} target="_blank" rel="noopener noreferrer">Open</a>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* FILES AND AGREEMENTS */}
        <section className="section" id="files">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">Files and agreements</p>
              <h2>Everything we share, in one place</h2>
            </div>
            <div className={myAgreements.length ? "grid-2" : "stack"}>
              <div className="card stack" style={{ gap: 12 }}>
                <h3 style={{ margin: 0 }}>Shared files</h3>
                <p className="small muted" style={{ margin: 0 }}>Send us documents we ask for, and find the ones we send you.</p>
                <SharedFiles initial={files} as="client" clientId={client.id} />
              </div>
              {myAgreements.length > 0 && (
                <div className="card stack" style={{ gap: 12 }}>
                  <h3 style={{ margin: 0 }}>Agreements</h3>
                  {myAgreements.map((a) => (
                    <div className="file-row" key={a.id}>
                      <div className="stack" style={{ gap: 2 }}>
                        <strong>{a.title}</strong>
                        <span className="tiny muted">{a.status === "signed" ? `Signed by ${a.signedName} on ${shortDate(a.signedAt ?? "")}` : "Waiting for your signature"}</span>
                      </div>
                      <a className={`btn btn-sm ${a.status === "signed" ? "btn-ghost" : "btn-primary"}`} href={`/p/${slug}/agreements/${a.id}`}>{a.status === "signed" ? "View" : "Read and sign"}</a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* BOOK */}
        {client.showBooking && (
          <section className="section" id="book">
            <div className="wrap">
              <div className="section-head">
                <p className="eyebrow">Book a session</p>
                <h2>Let us talk it through</h2>
                <p className="muted">
                  Book a free consult, a kickoff, or a check-in. Pick a time that works for you.
                </p>
              </div>
              {myAppts.length > 0 && (
                <div className="card stack" style={{ gap: 10, marginBottom: 20 }}>
                  <h3 style={{ margin: 0 }}>Your upcoming sessions</h3>
                  {myAppts.map((x) => (
                    <div key={x.id} className="row between" style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                      <span><strong>{longDate(x.date)}</strong>{x.start ? ` at ${fmtTime(x.start)} ET` : ""}</span>
                      <span className="row" style={{ gap: 10 }}>
                        {x.link && <a className="btn btn-sm btn-dark" href={x.link} target="_blank" rel="noopener noreferrer">Join</a>}
                        {x.token && <a className="linkbtn small" href={`/book/confirmed?id=${x.id}&t=${x.token}`}>Details or reschedule</a>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {settings.booking.enabled ? (
                <div className="card row between" style={{ padding: 32 }}>
                  <div className="stack" style={{ gap: 6, maxWidth: 560 }}>
                    <h3>Book a session</h3>
                    <p className="muted">A kickoff, working session, or check-in. See open times and book in a minute.</p>
                  </div>
                  <a className="btn btn-primary" href="/book?type=session">Pick a time</a>
                </div>
              ) : settings.bookingEmbed ? (
                <iframe className="embed" src={settings.bookingUrl} title="Book a session" loading="lazy" />
              ) : (
                <div className="card row between" style={{ padding: 32 }}>
                  <div className="stack" style={{ gap: 6, maxWidth: 560 }}>
                    <h3>Free consult</h3>
                    <p className="muted">Opens our booking calendar in a new tab.</p>
                  </div>
                  <a className="btn btn-primary" {...bookProps(settings)}>
                    Book a time
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* NEXT STEPS */}
        {client.nextSteps.length > 0 && (
          <section className="section alt" id="next">
            <div className="wrap narrow">
              <div className="section-head">
                <p className="eyebrow">Next steps</p>
                <h2>Here is how we begin</h2>
              </div>
              <ol className="steps">
                {client.nextSteps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <div className="wrap row between" style={{ alignItems: "flex-start", gap: 32 }}>
          <div className="stack" style={{ gap: 10, maxWidth: 420 }}>
            <div className="brandmark">
              <img src="/logo.png" alt="" style={{ width: 44, height: 48 }} />
              <span style={{ color: "var(--on-dark)" }}>{settings.brandName.toUpperCase()}</span>
            </div>
            <p className="small">{settings.tagline}</p>
          </div>
          <div className="stack small" style={{ gap: 6 }}>
            {settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
            {settings.phone && <span>{settings.phone}</span>}
            {settings.website && <a href={settings.website} target="_blank" rel="noopener noreferrer">Website</a>}
            {settings.instagram && <a href={settings.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
            <span>{settings.location}</span>
          </div>
        </div>
      </footer>
    </>
  );
}

