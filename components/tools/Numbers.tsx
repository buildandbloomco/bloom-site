"use client";

import { caseloadMath, pricingMath, usd0, type CaseloadIn, type PricingIn } from "@/lib/tools-def";
import { Num, Txt, uid, type ToolProps } from "./bits";

/* ---------- Pricing & Pay Calculator ---------- */
type Offer = { id: string; name: string; hours: number; price: number };
type PD = (PricingIn & { offers: Offer[] }) | null;
const P0: PricingIn & { offers: Offer[] } = { pay: 60000, expenses: 1000, taxPct: 25, profitPct: 5, hoursPerWeek: 30, weeksOff: 6, billablePct: 60, offers: [] };

export function Pricing({ data, set, ro }: ToolProps<PD>) {
  const d = { ...P0, ...(data ?? {}) };
  const m = pricingMath(d);
  const up = (p: Partial<typeof d>) => set({ ...d, ...p });
  const upOffer = (id: string, p: Partial<Offer>) => up({ offers: d.offers.map((o) => (o.id === id ? { ...o, ...p } : o)) });
  return (
    <div className="stack" style={{ gap: 18 }}>
      <section className="card stack" style={{ gap: 12 }}>
        <h3 style={{ margin: 0 }}>Your numbers</h3>
        <div className="tl-grid">
          <Num label="What you want to pay yourself" hint="Per year, before personal taxes" prefix="$" value={d.pay} step={1000} onChange={(v) => up({ pay: v })} ro={ro} />
          <Num label="Business expenses" hint="Per month: software, rent, help, insurance" prefix="$" value={d.expenses} step={50} onChange={(v) => up({ expenses: v })} ro={ro} />
          <Num label="Set aside for taxes" hint="% of revenue. Ask your tax pro; 25 to 30 is common" value={d.taxPct} onChange={(v) => up({ taxPct: v })} ro={ro} />
          <Num label="Set aside for profit" hint="% of revenue. Your cushion and reward" value={d.profitPct} onChange={(v) => up({ profitPct: v })} ro={ro} />
          <Num label="Hours you work per week" value={d.hoursPerWeek} onChange={(v) => up({ hoursPerWeek: v })} ro={ro} />
          <Num label="Weeks off per year" hint="Vacation, holidays, sick days" value={d.weeksOff} onChange={(v) => up({ weeksOff: v })} ro={ro} />
          <Num label="Billable share of your time" hint="% spent on paid client work, not admin or marketing" value={d.billablePct} onChange={(v) => up({ billablePct: v })} ro={ro} />
        </div>
      </section>
      <section className="card stack tl-result" style={{ gap: 10 }}>
        <h3 style={{ margin: 0 }}>What you need</h3>
        <div className="fin-tiles">
          <div><span className="k">Revenue per year</span><span className="v">{usd0(m.revenue)}</span></div>
          <div><span className="k">Per month</span><span className="v">{usd0(m.monthly)}</span></div>
          <div><span className="k">Billable hours a year</span><span className="v">{Math.round(m.hours).toLocaleString()}</span></div>
          <div><span className="k">Your minimum hourly rate</span><span className="v">{m.hours ? usd0(m.rate) : "Add your hours"}</span></div>
        </div>
        <p className="small" style={{ margin: 0 }}>Of {usd0(m.revenue)} a year: {usd0(d.pay)} pays you, {usd0(d.expenses * 12)} runs the business, about {usd0(m.tax)} goes to taxes, and {usd0(m.profit)} is profit.</p>
        <p className="tiny muted" style={{ margin: 0 }}>A planning estimate, not tax advice. Your minimum rate covers your costs; most businesses price above it.</p>
      </section>
      <section className="card stack" style={{ gap: 10 }}>
        <h3 style={{ margin: 0 }}>Check your offers</h3>
        <p className="small muted" style={{ margin: 0 }}>Add each offer with the total hours it really takes you, including prep, follow-up, and admin.</p>
        {d.offers.map((o) => {
          const floor = o.hours * m.rate;
          const ok = o.price >= floor;
          return (
            <div key={o.id} className="tl-offer">
              <Txt label="Offer" value={o.name} onChange={(v) => upOffer(o.id, { name: v })} ro={ro} placeholder="Strategy session" />
              <Num label="Total hours" step={0.25} value={o.hours} onChange={(v) => upOffer(o.id, { hours: v })} ro={ro} />
              <Num label="Your price now" prefix="$" value={o.price} onChange={(v) => upOffer(o.id, { price: v })} ro={ro} />
              <div className="stack" style={{ gap: 2, alignSelf: "end" }}>
                <span className="small">At least <strong>{usd0(floor)}</strong></span>
                {o.price > 0 && o.hours > 0 && <span className={`tag ${ok ? "green" : "rust"}`}>{ok ? "Covers you" : `${usd0(floor - o.price)} short`}</span>}
              </div>
              {!ro && <button type="button" className="linkbtn small no-print" style={{ alignSelf: "end" }} onClick={() => up({ offers: d.offers.filter((x) => x.id !== o.id) })}>Remove</button>}
            </div>
          );
        })}
        {!ro && <div className="no-print"><button type="button" className="btn btn-sm btn-ghost" onClick={() => up({ offers: [...d.offers, { id: uid(), name: "", hours: 1, price: 0 }] })}>+ Add an offer</button></div>}
      </section>
    </div>
  );
}

/* ---------- Caseload & Calendar Planner ---------- */
type CD = CaseloadIn | null;
const C0: CaseloadIn = { days: 4, startHour: 9, endHour: 17, sessionsPerDay: 5, sessionMin: 50, bufferMin: 10, adminHours: 5, lunchMin: 30, fee: 150 };
const hm = (min: number) => `${Math.floor(Math.abs(min) / 60)}h ${Math.round(Math.abs(min) % 60)}m`;

export function Caseload({ data, set, ro }: ToolProps<CD>) {
  const d = { ...C0, ...(data ?? {}) };
  const m = caseloadMath(d);
  const up = (p: Partial<CaseloadIn>) => set({ ...d, ...p });
  const warn: string[] = [];
  if (d.bufferMin < 10) warn.push("Less than 10 minutes between sessions leaves no time to reset or write a quick note.");
  if (m.adminPerSession < 15 && m.weekSessions) warn.push(`That's about ${Math.round(m.adminPerSession)} minutes of admin per session. Notes, billing, and email usually take more, so they spill into evenings.`);
  if (d.lunchMin < 20) warn.push("Plan a real break in the middle of the day.");
  if (d.days >= 5 && d.sessionsPerDay >= 6) warn.push("Five full days of six or more sessions is a lot to sustain. Consider one lighter day.");
  return (
    <div className="stack" style={{ gap: 18 }}>
      <section className="card stack" style={{ gap: 12 }}>
        <h3 style={{ margin: 0 }}>Your week as you want it</h3>
        <div className="tl-grid">
          <Num label="Days you see clients" value={d.days} onChange={(v) => up({ days: Math.min(7, v) })} ro={ro} />
          <Num label="Day starts" hint="Hour, 24-hour clock (9 = 9 AM)" value={d.startHour} step={0.5} onChange={(v) => up({ startHour: v })} ro={ro} />
          <Num label="Day ends" hint="17 = 5 PM" value={d.endHour} step={0.5} onChange={(v) => up({ endHour: v })} ro={ro} />
          <Num label="Sessions per day" value={d.sessionsPerDay} onChange={(v) => up({ sessionsPerDay: v })} ro={ro} />
          <Num label="Session length" hint="Minutes" value={d.sessionMin} step={5} onChange={(v) => up({ sessionMin: v })} ro={ro} />
          <Num label="Buffer between sessions" hint="Minutes" value={d.bufferMin} step={5} onChange={(v) => up({ bufferMin: v })} ro={ro} />
          <Num label="Lunch or break" hint="Minutes a day" value={d.lunchMin} step={5} onChange={(v) => up({ lunchMin: v })} ro={ro} />
          <Num label="Admin time each week" hint="Hours: notes, billing, email" value={d.adminHours} step={0.5} onChange={(v) => up({ adminHours: v })} ro={ro} />
          <Num label="Average fee per session" prefix="$" value={d.fee} onChange={(v) => up({ fee: v })} ro={ro} />
        </div>
      </section>
      <section className={`card stack tl-result ${m.fits ? "" : "tl-bad"}`} style={{ gap: 10 }}>
        <h3 style={{ margin: 0 }}>{m.fits ? "Your week fits" : "Your week doesn't fit"}</h3>
        <p style={{ margin: 0 }}>Each workday needs <strong>{hm(m.needDay)}</strong> and you have <strong>{hm(m.dayMin)}</strong>. {m.fits ? `That leaves ${hm(m.spare)} of breathing room a day.` : `You're short ${hm(m.spare)} a day, so it comes out of your evenings or your breaks.`}</p>
        <div className="fin-tiles">
          <div><span className="k">Sessions a week</span><span className="v">{m.weekSessions}</span></div>
          <div><span className="k">Session income a week</span><span className="v">{usd0(m.weekIncome)}</span></div>
          <div><span className="k">Admin per session</span><span className="v">{Math.round(m.adminPerSession)} min</span></div>
        </div>
        {warn.length > 0 && <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{warn.map((w) => <li key={w}>{w}</li>)}</ul>}
      </section>
    </div>
  );
}
