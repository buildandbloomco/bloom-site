// The starter library, written from Jadon's notes. Loaded once; edit everything in Admin > Wellness Library.
import type { Prompt } from "./course-types";
import type { LibraryPiece, LibrarySettings } from "./wellness-types";

const q = (id: string, label: string, type: Prompt["type"] = "long", help = "", options: string[] = []): Prompt => ({
  id, type, label, help, columns: [], rows: [], blankRows: 0, options,
});

type Seed = Omit<LibraryPiece, "createdAt" | "updatedAt" | "adminNote" | "audioUrl" | "videoUrl" | "teamOnly" | "collection" | "status" | "prompts"> &
  Partial<Pick<LibraryPiece, "adminNote" | "teamOnly" | "collection" | "status" | "prompts">>;

const SEEDS: Seed[] = [
  {
    id: "arrive", slug: "arrive", title: "Arrive", type: "audio", minutes: 5, order: 1,
    when: "For the start of the day",
    summary: "Settle your body and breath before the day asks anything of you, and choose one word to carry.",
    status: "draft", adminNote: "Script approved? Send it to your narrator, add the audio link, then publish.",
    body: `Welcome. Before the emails, before the messages, before anyone needs anything from you, take this moment for yourself. [pause 3 seconds]

Find a way to sit that feels supported. Let your feet rest on the floor. If it feels right, close your eyes, or let your gaze soften toward the ground. [pause 3 seconds]

Take a slow breath in through your nose. [pause 4 seconds] And let it go through your mouth. [pause 4 seconds] Again. Breathe in. [pause 4 seconds] And release. [pause 4 seconds]

Notice where your body is holding on this morning. Maybe your shoulders. Your jaw. Your hands. You don't have to fix anything. Just notice. [pause 6 seconds]

Now let your next breath travel to that place, and on the exhale, let it soften, even a little. [pause 8 seconds]

You woke up today as someone who has already come a long way. You are not who you used to be. Everything you did to get here is still with you, and so is the God who brought you through it. [pause 5 seconds]

Ask yourself quietly: What do I need to carry into today? [pause 8 seconds] And what can I leave right here, in this moment, so I don't have to carry it at all? [pause 10 seconds]

Choose one word for today. Maybe it's patience. Maybe it's courage. Maybe it's rest. Let that word come to you. [pause 8 seconds]

Breathe it in. [pause 4 seconds] Let everything else go on the exhale. [pause 4 seconds]

Today doesn't need you to be everything. It needs you to be present. And you are here. [pause 3 seconds]

When you're ready, gently open your eyes. Take your word with you. You've arrived.`,
    prompts: [q("arrive-word", "My word for today", "short")],
  },
  {
    id: "between-sessions-reset", slug: "between-sessions-reset", title: "Between Sessions Reset", type: "audio", minutes: 3, order: 2,
    when: "Between clients, meetings, or hard calls",
    summary: "Three minutes to leave the last conversation in its room and walk into the next one clear.",
    status: "draft", adminNote: "Waiting on audio.",
    body: `You just finished something. Before you start the next thing, give yourself these three minutes. [pause 2 seconds]

If you can, put your phone face down. Plant both feet on the floor and press them down, just slightly, so you can feel the ground holding you. [pause 4 seconds]

Breathe in for four. [pause 4 seconds] Hold for two. [pause 2 seconds] Out for six. [pause 6 seconds] One more time. In for four. [pause 4 seconds] Hold. [pause 2 seconds] Out for six. [pause 6 seconds]

Now picture the conversation you just left. Whatever it held, it belongs to that room. Not this one. [pause 4 seconds]

Gently shake out your hands, as if you're shaking off water. [pause 5 seconds] Roll your shoulders back. [pause 3 seconds]

Say to yourself: That was then. This is now. [pause 4 seconds]

Ask: What does the next person need from me? [pause 5 seconds] And what do I need to give it well? Water. A stretch. A breath. A quick prayer. [pause 5 seconds]

Take one last full breath, and let it all the way out. [pause 6 seconds]

You're clear. You're present. Go on in.`,
  },
  {
    id: "deposit-discard-pivot", slug: "deposit-discard-pivot", title: "Deposit, Discard, Pivot", type: "audio", minutes: 10, order: 3,
    when: "For the drive home or the end of the workday",
    summary: "Sort everything you took in today: keep what's for you, release what isn't, and send the rest where it belongs.",
    status: "draft", adminNote: "Waiting on audio. This one closes with your daily prayer.",
    body: `This practice is for the end of your day. If you're driving, keep your eyes open and your attention on the road. Nothing here asks you to close your eyes. If you'd rather, listen once you've parked. [pause 3 seconds]

All day long, you took things in. Conversations. Requests. Other people's moods. News. Compliments. Criticism. Some of it was meant for you. Some of it wasn't. [pause 4 seconds]

Tonight, before you walk through your door, we're going to sort it. Everything you took in today goes one of three ways. You deposit it, you discard it, or you pivot it. [pause 4 seconds]

Let's start with a breath. In through your nose. [pause 4 seconds] Out slowly. [pause 5 seconds] One more. [pause 4 seconds] And out. [pause 5 seconds]

**Deposit.** Think back over today. What was actually for you? A kind word. Something you learned. A moment you were proud of. Even a hard lesson that will help you grow. [pause 6 seconds]

Pick one or two, and deposit them. Say it to yourself: I'm keeping this. This is for my growth. [pause 8 seconds]

**Discard.** Now think about what you picked up today that isn't yours to carry. Someone's frustration that landed on you. A comment that stung but wasn't true. Worry about something you can't control tonight. [pause 8 seconds]

You don't have to argue with it. You just have to decide it's not coming home with you. Picture setting it down on the side of the road as you pass. [pause 6 seconds] Say to yourself: That's not mine. I'm leaving it here. [pause 8 seconds]

**Pivot.** Some things that came your way today were good, just not for you. An opportunity that fits someone else better. A thank-you that belongs to your team. An idea that someone in your life needs to hear. [pause 6 seconds]

Instead of holding on to what isn't yours, send it where it belongs. Think of who it's meant for. [pause 6 seconds] Maybe that's a text you'll send tomorrow, or credit you'll give. Let it go on its way. [pause 8 seconds]

Now notice how you feel. [pause 4 seconds] Lighter, maybe. Or just a little clearer. [pause 5 seconds]

Let's close with a prayer. Pray along, or simply listen. [pause 3 seconds]

Lord, let those things that are for me be received and deposited for the use of my growth, and let those negative things that are not for me be discarded. [pause 3 seconds] As for the blessings coming in my direction that are not for me, let them pivot to the person they are intended for, and let them receive them for the use of their growth. [pause 5 seconds]

As you get closer to home, ask: Who do I want to be when I walk in? [pause 8 seconds]

Take one more full breath. [pause 4 seconds] Let it out. [pause 5 seconds]

You kept what was yours. You let go of what wasn't. You sent the rest where it belongs. Welcome home.`,
    prompts: [
      q("ddp-deposit", "Deposit: what I'm keeping from today"),
      q("ddp-discard", "Discard: what I'm leaving behind"),
      q("ddp-pivot", "Pivot: what belongs to someone else, and who"),
    ],
  },
  {
    id: "the-right-yes", slug: "the-right-yes", title: "The Right Yes", type: "audio", minutes: 8, order: 4,
    when: "When you're stuck between trying and doing",
    summary: "All it takes is the right yes to go from trying to doing. Listen for yours, then take one real step.",
    status: "draft", adminNote: "Waiting on audio.",
    body: `There's a difference between trying and doing. Trying keeps one foot out the door. Doing means you've decided. [pause 3 seconds]

All it takes to go from one to the other is the right yes. [pause 3 seconds]

Let's slow down together. Sit comfortably. Let your hands rest. Take a breath in. [pause 4 seconds] And out. [pause 5 seconds] Again, in. [pause 4 seconds] And let it go. [pause 5 seconds]

Think of something you've been trying to do. A business idea. A conversation. A change you keep circling. [pause 8 seconds]

Notice the language you use about it. "I'm trying to." "I'm working on it." "One day." [pause 5 seconds] Notice how that feels in your body. [pause 6 seconds]

Here's something worth sitting with: sometimes we keep falling short because, somewhere inside, we've prepared to lose. We've already rehearsed the disappointment. [pause 5 seconds] What would change if you prepared to win instead? [pause 8 seconds]

Now get quiet. Be so in tune with God that when you hear Him say yes, you shift into a doing mindset. Listen underneath the noise, underneath what other people expect, underneath the fear of disappointing anyone. [pause 6 seconds] Is there a yes in there? A calm, clear knowing that says, This is mine to do. [pause 10 seconds]

You'll know the right yes because it brings peace without explanation. You don't have to overthink it or defend it. It just feels right. [pause 6 seconds]

If you hear it, try saying it differently. Not "I'm becoming." Say "I am." [pause 3 seconds] I am a business owner. I am someone who speaks up. I am ready. [pause 6 seconds] Say your own version now, silently or out loud. [pause 10 seconds]

Your yes is your activation. It's the moment trying becomes doing. [pause 4 seconds]

What's one step, one small, real step, that you can take in the next 24 hours to act on that yes? [pause 10 seconds]

Hold that step in your mind. See yourself doing it. [pause 6 seconds]

You are anointed to walk into rooms that people don't want you in. Even if it's uncomfortable, you have been assigned to be there. Walk in with confidence. What God thinks of you is what matters. [pause 5 seconds]

One last breath. In. [pause 4 seconds] And out. [pause 5 seconds]

Everything you're doing now is a reflection of who you are. Go say yes.`,
    prompts: [
      q("yes-what", "What I've been trying to do"),
      q("yes-iam", "My \"I am\" statement", "short"),
      q("yes-step", "My one step in the next 24 hours", "short"),
    ],
  },
  {
    id: "weekly-check-in", slug: "weekly-check-in", title: "Weekly Check-In", type: "journal", minutes: 10, order: 5,
    when: "At the end of the week",
    summary: "Five prompts that look back at what you carried and look ahead at what's in front of you.",
    status: "published",
    body: `We often use reflection to look back. But reflection is also about looking ahead: taking a moment to see what's right in front of you. This check-in does both.

Come back to it every week. Your answers save privately, so you can see how your weeks change over time.`,
    prompts: [
      q("wci-heavy", "What did I carry this week that felt heavy?", "long", "Journal · Looking back"),
      q("wci-fed", "What fed me this week? A person, a moment, a win, a rest."),
      q("wci-release", "What am I releasing before the new week starts?"),
      q("wci-ahead", "What's right in front of me next week that deserves my best energy?", "long", "Journal · Looking ahead"),
      q("wci-yesno", "What is one thing I will say yes to, and one thing I will say no to?"),
      q("wci-feel", "Next week, I want to feel...", "short", "Journal · One line to close"),
    ],
  },
  {
    id: "tapping-into-intuition", slug: "tapping-into-intuition", title: "Tapping Into Intuition", type: "journal", minutes: 30, order: 6,
    when: "Over three days, one set a day",
    summary: "Clear what gets in the way of hearing yourself: a cloudy filter, a crowded circle, and old hurt that hasn't been tended.",
    status: "published",
    body: `Your intuition is always speaking. Three things get in the way of hearing it: a cloudy filter, a crowded circle, and old hurt that hasn't been tended. Each set below clears one of them. Do one set a day.

**Fix your filter.** Your filter is how you take in what happens to you. Be careful of your thoughts, because thoughts become words, and words shape what you expect.

**Audit your associates.** The people around you shape what feels possible. Find a solid mentor for where you're going, and study them.

**Tackle your trauma.** You have evolved. You are no longer who you used to be, and it's worth sitting with yourself to get to know who you are now.

*If something here feels too heavy to hold alone, that's a good moment to reach out to a counselor, a pastor, or someone you trust.*`,
    prompts: [
      q("tii-story", "What story have I been telling myself lately, over and over?", "long", "Journal · Set 1: Fix your filter"),
      q("tii-true", "Is that story true, or is it just familiar?"),
      q("tii-specific", "Rewrite one thing I want so it's specific, not broad."),
      q("tii-clear", "Who leaves me feeling clearer after we talk? Who leaves me feeling foggy?", "long", "Journal · Set 2: Audit your associates"),
      q("tii-voice", "Whose voice am I hearing when I doubt myself?"),
      q("tii-mentor", "Who is a mentor for where I'm going next? What could I learn by studying them?"),
      q("tii-old", "What old hurt still shows up in how I react today?", "long", "Journal · Set 3: Tackle your trauma"),
      q("tii-role", "Think of a relationship that didn't go the way I hoped. Looking honestly, what was my role, and what wasn't mine to carry?"),
      q("tii-tell", "What would I tell the version of me who first felt that hurt?"),
    ],
  },
  {
    id: "signs-of-alignment", slug: "signs-of-alignment", title: "Signs of Alignment", type: "journal", minutes: 15, order: 7,
    when: "When you want to know if you're on the right path",
    summary: "Peace without explanation, synchronicity, and authentic expression: three quiet signs you're where you're meant to be.",
    status: "published",
    body: `Alignment isn't loud. It shows up in small, steady ways. Here are three signs to look for.

**1. Peace without explanation.** When you're in alignment, you don't need to overthink or over-explain. There's an inner calm that tells you, *This feels right.*

**2. Synchronicity becomes normal.** The right people, opportunities, and resources start flowing in without force. It feels like life is meeting you where you are. You attract who you are.

**3. Authentic expression flows easily.** You don't feel like you have to shrink or shape-shift. You move, speak, and create from a place that feels honest and grounded in who you are.

When you're walking in purpose, you're surrounded by evidence of God's plan for you. These prompts help you notice it.`,
    prompts: [
      q("soa-calm", "Where in my life do I feel that calm right now?", "long", "Journal · Peace without explanation"),
      q("soa-explain", "Where am I over-explaining myself, and what might that be telling me?"),
      q("soa-showed", "What has shown up lately that I didn't have to chase?", "long", "Journal · Synchronicity"),
      q("soa-chasing", "What am I still chasing that may not be for me?"),
      q("soa-myself", "Where do I feel most like myself?", "long", "Journal · Authentic expression"),
      q("soa-shrink", "Where do I shrink, and what would it look like to show up fully there?"),
      q("soa-peace", "One thing I'm choosing peace about, and one thing I'm giving grace to because it's no longer mine", "long", "Journal · Closing reflection"),
    ],
  },
  {
    id: "before-a-hard-conversation", slug: "before-a-hard-conversation", title: "Before a Hard Conversation", type: "tool", minutes: 2, order: 8,
    when: "Right before feedback, conflict, or bad news",
    summary: "A two-minute page to steady yourself, name what you want, and choose your first words.",
    status: "published",
    body: `## 1. Steady your body (30 seconds)

Feet on the floor. Breathe in for four, out for six, three times. A slower exhale tells your body you're safe enough to think clearly.

## 2. Name what you want (30 seconds)

Finish the two sentences below. If you can't finish the second one, pause. The conversation may need more time.

## 3. Look for the root (30 seconds)

Ask yourself: Am I ready to talk about what's really going on, or only what's on the surface? If there's anger in the room, remember it's often protecting something else, like hurt or fear. Get curious about what's underneath, yours and theirs.

## 4. Choose your opening line (30 seconds)

Pick one, or write your own:

- "I want to talk about something that matters to me, and I want to hear your side too."
- "This isn't easy to say, and I'm saying it because I care about how we work together."
- "Can we slow down and look at what's really going on here?"

## After

Whatever happened, it's done. Use **Deposit, Discard, Pivot** to sort what you're keeping from it.`,
    prompts: [
      q("bhc-understand", "What I want them to understand is...", "short"),
      q("bhc-after", "What I want for us after this is...", "short"),
      q("bhc-opening", "My opening line", "short"),
    ],
  },
  {
    id: "digging-up-holes", slug: "digging-up-holes", title: "Digging Up Holes", type: "tool", minutes: 5, order: 9,
    when: "When a feeling comes up in a relationship",
    summary: "Disappointment, anger, or fear: what you feel when you hit the bottom tells you what you found.",
    status: "published",
    body: `Building any relationship, at work, at home, or with yourself, is a lot like digging. You go in expecting to find something: trust, support, understanding. What you feel when you hit the bottom tells you what you found.

**Disappointment: the hole is empty.** You dug, and what you hoped for wasn't there. Disappointment isn't weakness. It is information. It tells you where you expected more than was given.

**Anger: you hit a water pipe.** Something burst, and now it's messy and urgent. Anger is often a secondary emotion. It rushes in to protect something underneath it, like hurt, fear, or feeling unseen. Before you respond to the flood, find the pipe.

**Fear: you found it, but it's hard to reach.** What you were looking for is there, but getting to it will take more work than you planned. Fear asks whether you're willing to keep digging.

## When a feeling comes up, try this

1. Name it: disappointment, anger, or fear.
2. Ask, "What did I hit?" Say it in one sentence.
3. If it's anger, ask, "What is this protecting?"
4. Choose your next move: stop digging, repair the pipe, or keep going with a plan.`,
    prompts: [
      q("duh-hit", "Think of a recent conversation that left me unsettled. What did I hit?"),
      q("duh-root", "Am I getting to the root, or taking it at face value so I don't have to go through the hard part?"),
      q("duh-worth", "What would it take to keep digging, and is this relationship worth that work?"),
    ],
  },
  {
    id: "boundary-scripts", slug: "boundary-scripts", title: "Boundary Scripts", type: "tool", minutes: 5, order: 10,
    when: "Whenever you need the words",
    summary: "Words for no, not now, and here's what I can do, starting with trusting your instincts.",
    status: "published",
    body: `## Start here: trust your instincts

Most of us know when something is a no. What stops us is the fear of disappointing someone. That fear is real, but it isn't a reason to ignore the voice guiding you. Your instincts are information. Disappointing someone for a moment costs less than abandoning yourself for months.

## When the answer is no

- "Thank you for thinking of me. I'm not able to take this on."
- "That doesn't work for me, but I appreciate you asking."
- "I'm going to pass on this one."

## When the answer is not now

- "I can't give this the attention it deserves right now. Can we revisit it in two weeks?"
- "I'm at capacity this month. If it can wait, I'd like to help later."

## When you can offer part of it

- "I can't do all of it, but here's what I can do."
- "I can give you 30 minutes on Thursday. Would that help?"

## When someone pushes back

- "I understand it's not the answer you wanted. My answer is still no."
- "I've thought about it, and I'm going to stick with my decision."

## At work, with a supervisor

- "I want to do this well. To take it on, what should I move off my plate?"
- "Here's what I'm working on right now. Which of these matters most?"

## A note on guilt

Guilt after a boundary doesn't mean you did something wrong. It often means you did something new. Let it pass through, and notice that the relationship is still standing.`,
    prompts: [q("bs-boundary", "One boundary I need to set this week, and the words I'll use")],
  },
  {
    id: "theres-prophecy-in-purpose", slug: "theres-prophecy-in-purpose", title: "There's Prophecy in Purpose", type: "reading", minutes: 5, order: 11,
    when: "When you need to look ahead, not back",
    summary: "Peace for what is, grace for what's no longer, and why purpose is where prophecy and manifestation live.",
    status: "draft", adminNote: "Add your two stories where the brackets are, remove the brackets, then publish.",
    body: `*By Jadon Thomas*

There's prophecy in purpose.

I'm in my element now more than I have ever been before. More and more, I find myself in a state of gratitude, because I'm surrounded by evidence of God's plan for me.

It wasn't always this way. [Jadon: a short story about a season when you were chasing something, or someone, that wasn't for you.]

What changed wasn't that life got easier. What changed is that I stopped holding on to what isn't for me. I no longer chase people, things, or even places that are not for me. I allow myself peace for what is, and grace for what's no longer.

That shift sounds simple. It isn't. Letting go of what isn't for you means trusting that what is for you is on its way. It means sitting in the space between, where the old thing is gone and the new thing hasn't fully arrived. For many of us, and especially for those of us who have always had to fight for our place, that in-between space can feel dangerous. We were taught to hold on tight.

But here's what I've learned: we often use reflection as a tool for looking back. We replay what happened, what we should have done, who we were. Reflection matters. But most importantly, it's also about looking ahead. Literally taking a moment to look at what's in front of you.

When I look at what's in front of me now, I see purpose. [Jadon: one or two sentences about the work in front of you now: Build & Bloom, your students, your community.]

And purpose is where prophecy lives. It's where what was spoken over you, what you felt in your spirit long before you had the words for it, starts to take shape in real life. You don't manifest by wishing. You manifest by walking in the direction of what you were made for, one faithful step at a time.

So here's my invitation to you this week. Look back only long enough to say thank you, for the lessons, for the endings, for the version of you that got you here. Then turn around. Look at what's in front of you. Ask: What is my purpose asking of me today?

Focus there. That's where your prophecy and manifestation live.`,
    prompts: [
      q("pip-holding", "What am I still holding on to that isn't for me?", "long", "Journal · Reflect"),
      q("pip-evidence", "What evidence of my purpose is already around me?"),
      q("pip-asking", "What is my purpose asking of me this week?"),
    ],
  },
  {
    id: "team-check-in-kit", slug: "team-check-in-kit", title: "Team Check-In Kit", type: "team", minutes: 15, order: 12,
    when: "Once a week, at the start of a staff meeting",
    summary: "A 15-minute weekly check-in any team member can lead, plus Getting to the Root for when tension comes up.",
    status: "published", teamOnly: true,
    body: `A short, steady check-in helps a team notice strain early, before it turns into burnout or conflict. Anyone can lead it. Rotate the facilitator so it belongs to everyone.

## Ground rules (read aloud the first few times)

- Share what you're comfortable sharing. Passing is always okay.
- What's said here stays here.
- We listen to understand, not to fix.

## The 15 minutes

| Time | Step | What happens |
| --- | --- | --- |
| 2 min | Arrive | Play Between Sessions Reset, or lead three slow breaths |
| 5 min | One word, one thing | Each person shares one word for their week and one thing they need |
| 5 min | Go a layer deeper | The facilitator asks one prompt from the list below |
| 3 min | Close | Each person names one small commitment for the week ahead |

## Prompts for going a layer deeper (one per week)

1. What's taking more energy than it should right now?
2. Where could we make each other's work easier this week?
3. What's something that went well that nobody noticed?
4. What are we carrying as a team that we could set down?
5. If you could change one thing about how we work, what would it be?

## Getting to the Root: when tension comes up

When something honest surfaces, like frustration, mistrust, or anger, teams often handle it at face value so they don't have to go through the harder work of resolving it. This guide helps you go one level deeper.

1. **Pause the agenda.** "This sounds important. Let's give it real time, now or in a separate conversation."
2. **Name the surface.** Say back what you heard, without judging it.
3. **Ask what's underneath.** "What's the part of this that matters most to you?" Anger is often protecting something, like feeling unseen or overloaded.
4. **Check what you found.** Use Digging Up Holes: was it disappointment, anger, or fear?
5. **Agree on one next step.** A follow-up talk, a change to a process, or a check-in date. Write it down.

## For the team lead

A check-in works when people see something change because of it. Once a month, share one thing the team raised and what you did about it.`,
  },
];

const SOUND = (id: string, title: string, summary: string, order: number): Seed => ({
  id, slug: id, title, type: "soundscape", minutes: 10, order, collection: "Soundscapes", status: "draft",
  when: "Press play and let it run, or loop it for as long as you like",
  summary,
  adminNote: `Upload ${id}-library-10min.mp4 in the Video section, then publish.`,
  body: `Find a comfortable place to sit or lie down. Headphones make it even better.

You don't have to do anything here. Let the sound hold the space. If you'd like something to do with your breath, follow the slow change in the picture: breathe in as it brightens, and out as it settles.

When a thought comes, notice it, and let it float by like water. Come back to the sound as many times as you need.`,
});

export const SOUNDSCAPES: Seed[] = [
  SOUND("waterfall", "Waterfall", "Falling water with a soft, warm tone underneath. For focus, rest, or a reset in the middle of the day.", 101),
  SOUND("rain", "Gentle Rain", "Steady rain on a quiet evening. For winding down after a long day.", 102),
  SOUND("ocean", "Ocean Waves", "Slow waves that rise and fall about every ten seconds, a natural pace for breathing.", 103),
  SOUND("stream", "Forest Stream", "A creek over the stones, bright and moving. For clearing your head.", 104),
  SOUND("deep-rest", "Deep Rest", "A low, warm hum with a soft rumble. For sleep, or for the heaviest days.", 105),
  SOUND("warm-tones", "Warm Tones", "Slow, steady meditative tones that swell and settle. For prayer, meditation, or quiet focus.", 106),
];

export function seedPieces(now: string): LibraryPiece[] {
  return [...SEEDS, ...SOUNDSCAPES].map((s) => ({
    adminNote: "",
    audioUrl: "",
    videoUrl: "",
    teamOnly: false,
    collection: "Starter library",
    status: "published" as const,
    prompts: [],
    ...s,
    createdAt: now,
    updatedAt: now,
  }));
}

export const SEED_LIBRARY_SETTINGS: LibrarySettings = {
  intro: "Care you can come back to. Guided audio, journaling, coping tools, and readings for the people doing the work. Start anywhere.",
  affirmations: [
    "All it takes is the right yes to go from trying to doing.",
    "My yes is my activation.",
    "I prepare to win, not to lose.",
    "I am, not I'm becoming. Everything I'm doing now reflects who I am.",
    "My greatness was inherited the moment I was created.",
    "I allow myself peace for what is and grace for what's no longer.",
    "I no longer chase what is not for me.",
    "I am attracting who I am.",
    "I don't have to shrink or shape-shift to belong.",
    "I keep what's for me, release what isn't, and send the rest where it belongs.",
    "The lesson remains. I get to choose how I learn it.",
    "I am open to the imperfections of love.",
    "I walk into every room I'm called to, with confidence.",
    "Reflection isn't only for looking back. I look at what's in front of me.",
  ],
};
