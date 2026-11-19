/** Set It Down (first published as Bloom Again), the guided journal: the companion page's practices and the 30-day follow-along emails.
 *  Shared by the page, the signup route, and the daily cron. */

export interface Practice {
  id: string;
  part: "Rest" | "Reconnect" | "Release" | "Root";
  name: string;
  blurb: string;
  steps: string[];
  /** Path under /public once the recording is added, e.g. "/bloom-again/audio/box-breathing.mp3" */
  audio?: string;
}

export const PRACTICES: Practice[] = [
  { id: "box-breathing", part: "Rest", name: "Box Breathing", blurb: "A calming breath for when your mind is racing.", steps: ["Breathe in through your nose for a count of 4.", "Hold your breath gently for 4.", "Breathe out slowly through your mouth for 4.", "Hold, empty, for 4.", "Repeat four times. Notice your shoulders drop."] },
  { id: "tension-release", part: "Rest", name: "Tension Release", blurb: "Your body keeps score. Let it put some of it down.", steps: ["Sit or lie down somewhere comfortable.", "Starting with your feet, tighten the muscles for five seconds.", "Release, and notice the difference for ten seconds.", "Move up: calves, thighs, belly, hands, shoulders, face.", "End with three slow breaths and one word for how you feel."] },
  { id: "mirror-moment", part: "Reconnect", name: "The Mirror Moment", blurb: "Meet yourself with the kindness you give everyone else.", steps: ["Stand in front of a mirror and look into your own eyes.", "Take one slow breath, in and out.", "Say your name out loud, then: \"I see you.\"", "Name one thing you're proud of yourself for this week.", "Close with an affirmation for this season."] },
  { id: "joy-inventory", part: "Reconnect", name: "The Joy Inventory", blurb: "Joy is information. It shows you the way back to yourself.", steps: ["For one week, notice every moment that makes you smile.", "Write each one down, no matter how small.", "At the end of the week, read the list out loud.", "Circle the three that surprised you.", "Plan one of them on purpose next week."] },
  { id: "let-it-go", part: "Release", name: "Write It, Fold It, Let It Go", blurb: "A simple ritual for something you're ready to put down.", steps: ["On a separate piece of paper, write what you're releasing.", "Read it once, out loud or in your heart.", "Fold it in half, then in half again.", "Say: \"I don't have to carry this anymore.\"", "Tear it up, bury it, or throw it away. Notice how your body feels."] },
  { id: "grounding", part: "Release", name: "5, 4, 3, 2, 1 Grounding", blurb: "For anxious moments when your thoughts start spinning.", steps: ["Name 5 things you can see.", "Name 4 things you can touch.", "Name 3 things you can hear.", "Name 2 things you can smell.", "Name 1 thing you can taste. Then take one deep breath."] },
  { id: "right-yes", part: "Root", name: "The Right Yes Check", blurb: "Before you agree to something new, ask yourself:", steps: ["Does this line up with what matters most to me right now?", "Do I have the time and energy for it without taking from my rest?", "Am I saying yes out of love, or out of fear and guilt?", "What will I have to say no to in order to say yes to this?", "If it's not a clear yes, it's a no for now."] },
  { id: "weekly-reset", part: "Root", name: "The Weekly Reset", blurb: "Thirty minutes each week to keep your roots strong.", steps: ["Pick the same time each week and protect it.", "Look back: what filled you, and what drained you?", "Look ahead: what's coming, and where will you rest?", "Choose your One Priority for the week.", "End with one thing you're grateful for."] },
];

export interface DayEmail { subject: string; preheader: string; heading: string; body: string; /** Which journal page to open today */ today: string }

/** One short note a day, matched to the journal. Day 1 goes out the moment someone signs up. */
export const DAYS: DayEmail[] = [
  // Week 1: Rest
  { subject: "Day 1: You made it to the first page", preheader: "Start with the Bloom Check. No wrong answers.", heading: "Welcome to Set It Down",
    body: "I'm so glad you're here. For the next 30 days, I'll send you one short note each morning to walk beside you as you journal.\n\nToday, start at the very beginning: **the Bloom Check**. Circle a number for each area of your life. Be honest, not hard on yourself. This is a starting point, not a grade.\n\nThen fill in your first daily check-in. Five minutes is plenty.",
    today: "The Bloom Check and Day 01" },
  { subject: "Day 2: What are you carrying?", preheader: "Get it out of your head and onto the page.", heading: "Name what you're carrying",
    body: "Most of us carry far more than we admit, even to ourselves. Today, turn to the Burnout Warning Signs page and check what's been true lately.\n\nNo shame in what you find. Noticing is the first act of care.",
    today: "Burnout Warning Signs and Day 02" },
  { subject: "Day 3: Breathe in a box", preheader: "A 1-minute practice for a racing mind.", heading: "Four counts at a time",
    body: "Before you write today, try **Box Breathing**. In for 4, hold for 4, out for 4, hold for 4. Four rounds.\n\nIt's simple on purpose. When your mind is racing, simple is what works. Then open to the first Rest prompt: when was the last time you rested without guilt?",
    today: "Practice: Box Breathing, Rest 01, and Day 03" },
  { subject: "Day 4: Is that true?", preheader: "What do you believe will happen if you slow down?", heading: "The story behind the hustle",
    body: "So many of us believe that if we slow down, everything falls apart. Today's prompt asks you to look at that belief and ask a simple question: **is that true?**\n\nYou might be surprised how much keeps standing when you sit down.",
    today: "Rest 04 and Day 04" },
  { subject: "Day 5: Your body has been talking", preheader: "A tension release to help it let go.", heading: "Listen to your body",
    body: "Your shoulders, your jaw, your stomach. They've been holding what your schedule wouldn't let you feel.\n\nTry the **Tension Release** practice today, then write about what you noticed. Your body is not working against you. It's been trying to get your attention.",
    today: "Practice: Tension Release, Rest 02, and Day 05" },
  { subject: "Day 6: Permission granted", preheader: "Write yourself a permission slip today.", heading: "You don't need anyone's permission. But here it is.",
    body: "Today, write yourself a permission slip. **I give myself permission to...**\n\nRest. Say no. Leave the dishes. Ask for help. Take the long way home. Write as many as you need.",
    today: "Rest 09 and Day 06" },
  { subject: "Day 7: Your first week, in your own words", preheader: "Time for your first weekly reflection.", heading: "One week in",
    body: "Look at you. Seven days of showing up for yourself.\n\nToday, turn to **Week 01** in the back and reflect: what filled you up, what drained you, and what you want more of. Then choose your One Priority for next week.\n\nIf you missed days, that's okay. There's no falling behind here.",
    today: "Week 01 reflection and Day 07" },
  // Week 2: Reconnect
  { subject: "Day 8: Who were you before?", preheader: "Before everyone needed something from you.", heading: "The girl you used to be",
    body: "This week we move into **Reconnect**. Before the roles, the responsibilities, and the to-do lists, there was a girl who loved certain things for no reason at all.\n\nToday, write about her. What did she love? What made her laugh?",
    today: "Reconnect 01 and Day 08" },
  { subject: "Day 9: Look yourself in the eye", preheader: "The Mirror Moment, in under two minutes.", heading: "The Mirror Moment",
    body: "This one might feel awkward. Do it anyway.\n\nStand in front of a mirror, look into your own eyes, say your name, and then say: **\"I see you.\"** Name one thing you're proud of this week.\n\nWe give that kind of attention to everyone else. You deserve it too.",
    today: "Practice: The Mirror Moment and Day 09" },
  { subject: "Day 10: Twenty small joys", preheader: "Keep going even when it gets hard.", heading: "Make a joy list",
    body: "Today's prompt asks for twenty things that bring you joy. The first ten will come easily. The last ten are where the magic is.\n\nThen start your **Joy Inventory** for the week: notice every moment that makes you smile and write it down.",
    today: "Reconnect 02, Practice: The Joy Inventory, and Day 10" },
  { subject: "Day 11: When do you feel most like you?", preheader: "Who are you with? What are you doing?", heading: "Most like yourself",
    body: "Think of a moment when you felt completely like yourself. Not performing, not managing, just being.\n\nWho were you with? Where were you? What would it take to have more moments like that?",
    today: "Reconnect 04 and Day 11" },
  { subject: "Day 12: Let the compliment land", preheader: "Stop brushing it off.", heading: "Let it in",
    body: "How often do people tell you something kind and you wave it away?\n\nToday, write those compliments down. Then read them slowly, one at a time, and let them land. They were true when they were said, and they're still true now.",
    today: "Reconnect 05 and Day 12" },
  { subject: "Day 13: The relationships that fill you", preheader: "And the ones that cost too much.", heading: "Who fills your cup?",
    body: "Some relationships pour into you. Others take more than they give. Most of us have both.\n\nToday, just notice. You don't have to make any decisions yet. Awareness comes first.",
    today: "Reconnect 06 and Day 13" },
  { subject: "Day 14: Two weeks of coming home", preheader: "Your second weekly reflection.", heading: "Halfway to a habit",
    body: "Two weeks. That's real.\n\nTurn to **Week 02** and reflect on what you found this week. Then look at your Joy Inventory and circle the three moments that surprised you. Plan one of them on purpose next week.",
    today: "Week 02 reflection and Day 14" },
  // Week 3: Release
  { subject: "Day 15: Not everything you carry is yours", preheader: "Week three: Release.", heading: "What isn't yours to carry?",
    body: "This week is about **Release**. Some of what weighs you down was handed to you: expectations, old stories, roles you never agreed to.\n\nToday, name what you're holding that is no longer yours. Go gently.",
    today: "Release 01 and Day 15" },
  { subject: "Day 16: Ground yourself", preheader: "5, 4, 3, 2, 1, for anxious moments.", heading: "Come back to the room",
    body: "Release can stir things up. When it does, try **5, 4, 3, 2, 1 Grounding**: five things you see, four you can touch, three you hear, two you smell, one you taste.\n\nThen write about where in your life you're saying yes when you mean no.",
    today: "Practice: 5, 4, 3, 2, 1 Grounding, Release 03, and Day 16" },
  { subject: "Day 17: The story you're ready to stop telling", preheader: "You get to write a new one.", heading: "A new story",
    body: "\"I'm the strong one.\" \"I always have to hold it together.\" \"If I don't do it, no one will.\"\n\nWhich story about yourself are you ready to stop telling? Write it down, and then write what you'd like to be true instead.",
    today: "Release 02 and Day 17" },
  { subject: "Day 18: Write it, fold it, let it go", preheader: "A simple release ritual.", heading: "Set it down",
    body: "Today, try the release ritual. Write what you're letting go of on a separate sheet of paper. Read it once. Fold it. Say, **\"I don't have to carry this anymore.\"** Then tear it up or throw it away.\n\nNotice how your body feels afterward.",
    today: "Practice: Write It, Fold It, Let It Go, and Day 18" },
  { subject: "Day 19: The boundary you need", preheader: "And the exact words to say it.", heading: "Say it out loud",
    body: "Boundaries are easier when you've practiced the words.\n\nToday, write down a boundary you need to set. Then write the exact sentence you'll use to say it. Read it out loud a few times. It gets easier.",
    today: "Release 09 and Day 19" },
  { subject: "Day 20: What would you stop tomorrow?", preheader: "If no one would be upset.", heading: "Imagine no one minded",
    body: "If no one would be disappointed, what would you stop doing tomorrow?\n\nYou don't have to stop it yet. But naming it shows you where your energy is going, and where it could go instead.",
    today: "Release 11 and Day 20" },
  { subject: "Day 21: Three weeks of letting go", preheader: "Your third weekly reflection.", heading: "Lighter",
    body: "Three weeks. You've rested, you've reconnected, and this week you've started setting things down.\n\nTurn to **Week 03**. What feels lighter? What are you still holding? Both answers are okay.",
    today: "Week 03 reflection and Day 21" },
  // Week 4: Root
  { subject: "Day 22: Grow something that lasts", preheader: "Final season: Root.", heading: "Put down roots",
    body: "This last week is about **Root**: the values, rhythms, and boundaries that keep you well, so you don't have to start over every time life gets heavy.\n\nToday, write your five core values. Then look at your calendar. Does it reflect them?",
    today: "Root 01 and Day 22" },
  { subject: "Day 23: The Right Yes", preheader: "Five questions before you say yes.", heading: "Choose your yes",
    body: "Before you say yes to anything new this week, run it through the **Right Yes Check**. Does it match what matters most? Do you have the energy without taking from your rest? Is it love, or guilt?\n\nIf it's not a clear yes, it's a no for now.",
    today: "Practice: The Right Yes Check, Root 08, and Day 23" },
  { subject: "Day 24: Your early warning signs", preheader: "So you catch burnout before it catches you.", heading: "Know your signals",
    body: "Burnout rarely arrives all at once. It whispers first.\n\nToday, write the early signs that tell you you're heading there again, and what you'll do when you notice them. Look back at your Burnout Warning Signs page from Day 2. What's changed?",
    today: "Root 04 and Day 24" },
  { subject: "Day 25: Who is on your team?", preheader: "Nobody blooms alone.", heading: "Your support team",
    body: "Who do you call when you need comfort? Advice? A laugh?\n\nWrite their names down. If some spots are empty, that's useful to know too. Support is something you can build.",
    today: "Root 05 and Day 25" },
  { subject: "Day 26: One Priority", preheader: "If you focused on just one thing for 90 days.", heading: "Just one",
    body: "Trying to fix everything at once is how we end up exhausted. Today, choose **One Priority** for the next 90 days and write why it matters.\n\nOne thing, done with care, beats ten things done on empty.",
    today: "Root 07 and Day 26" },
  { subject: "Day 27: The woman you're becoming", preheader: "How does she spend her mornings?", heading: "Meet her",
    body: "Describe the woman you are becoming. How does she start her day? How does she speak to herself? What does she say no to?\n\nThen pick one small thing she does and try it tomorrow.",
    today: "Root 09 and Day 27" },
  { subject: "Day 28: Build your Weekly Reset", preheader: "Thirty minutes a week to keep your roots strong.", heading: "Four weeks in",
    body: "Today, do your **Week 04** reflection, and then set up your **Weekly Reset**: the same time each week to look back, look ahead, and choose your One Priority.\n\nThis is how the work keeps going after the 30 days end.",
    today: "Practice: The Weekly Reset, Week 04, and Day 28" },
  { subject: "Day 29: Look how far you've come", preheader: "Take the Bloom Check again.", heading: "The Bloom Check, again",
    body: "Turn to the Bloom Check at the back of the journal and circle where you are today. Then flip back to the one you did on Day 1.\n\nGrowth isn't always a straight line, and every number tells you something. Whatever you see, you showed up for yourself for 29 days. That matters.",
    today: "The Bloom Check, Again, and Day 29" },
  { subject: "Day 30: You bloomed again", preheader: "And you can, as many times as it takes.", heading: "Day 30",
    body: "You did it. Thirty days of choosing yourself.\n\nToday, write the letter to yourself one year from now, and your promise to yourself going forward. Keep using the check-ins and the weekly pages. They're yours.\n\nIf you'd like to keep going with me, I'd love that. You'll find a few ways below: a day of rest and reset in person, the Wellness Library, or a conversation with me about what's next.",
    today: "Closing letters and Day 30" },
];
