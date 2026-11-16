// The Right Yes: a 21-day guide from trying to doing, by Jadon Thomas.
// Edit the words here, then run: node guides/right-yes/build.mjs
// Scripture is the King James Version (public domain).
// Each reading is a list of paragraphs. Keep a reading to about 300 words so it fits on one page.

export const META = {
  title: "The Right Yes",
  subtitle: "A 21-day guide from trying to doing",
  author: "Jadon Thomas",
  line: "All it takes is the right yes to go from trying to doing.",
};

export const WELCOME = [
  "I lived in trying for a long time. Busy but not moving. Planning the same thing for years. Pouring into everyone else, and quietly doubting what I already knew I was called to do. I heard God clearly, and I still didn't move.",
  "Trying is comfortable because it keeps one foot out the door. Doing puts both feet in. And the thing that moves you from one to the other is rarely more information or a better plan. It's a yes. The right one, said on purpose, with both feet.",
  "This guide is for the season you're in right now, if you're busy but not moving, if you've been planning the same thing for years, if you're the one everyone leans on, if you're waiting to feel ready, or if you've heard God clearly and still haven't moved.",
  "Over 21 days we'll walk in three steps. First we hear it: we get honest about where we've been circling. Then we clear it: we practice the no's that make room. Then we say it: we recognize the right yes and put it in motion.",
  "You don't have to have it figured out to start. You only have to show up for today's page.",
];

export const HOW = [
  ["A short reading", "A piece of my story and a teaching. About five minutes."],
  ["Scripture and reflection", "One verse to sit with, and a few lines on what it's saying to you."],
  ["A journal prompt", "Space to write. Be honest. Nobody else has to read it."],
  ["Your Right Yes step", "One small move to make today. Small is the point."],
];

export const HOW_NOTES = [
  "Every day takes about 15 minutes. Read it on your phone, or print it and write in it with a pen.",
  "Miss a day? Don't start over. Pick up where you are. Grace is part of the practice.",
  "Faith is present in these pages, and gentle. If you're still finding your way with faith, take what serves you and leave the rest.",
];

export const WEEKS = [
  {
    n: 1, name: "Hear It", sub: "Get honest about where you've been circling.",
    intro: "This week isn't about fixing anything. It's about noticing. Before you can say the right yes, you have to hear the places where you've been saying \"I'm trying\" instead. Each day this week looks at one of the six signs of trying. You may see yourself in all six. Most of us do. Be kind to yourself while you look.",
    days: [1, 7],
  },
  {
    n: 2, name: "Clear It", sub: "Practice the no's that make room.",
    intro: "Every yes is also a no to something else. The no is happening either way. The only question is whether you're choosing it on purpose. This week we make room: we look at what we're chasing, what's draining us, what's been keeping us stuck, and we practice saying no with grace.",
    days: [8, 14],
  },
  {
    n: 3, name: "Say It", sub: "Recognize your right yes and put it in motion.",
    intro: "You've listened. You've made room. Now it's time to name the yes that keeps coming back to you, test it, write it down, and take the first real step. You won't feel completely ready. That's all right. Ready usually shows up after you begin.",
    days: [15, 21],
  },
];

export const DAYS = [
  // ---------------- WEEK 1: HEAR IT ----------------
  {
    n: 1, title: "Trying Is Not Doing", line: "All it takes is the right yes to go from trying to doing.",
    reading: [
      "\"Trying\" is a comfortable word. It sounds like effort. And it lets us off the hook, because trying can go on forever without anyone asking where it's leading.",
      "I lived in trying for a long time. I was trying to build something. I was trying to figure out what I was really called to do. I had notebooks full of plans, and plenty of conversations about \"one day,\" but no decision.",
      "Here's the difference I finally saw. Trying keeps one foot out the door. Doing puts both feet in. Trying says, \"Let me see how this goes.\" Doing says, \"This is mine, and I'm going to build it.\"",
      "The shift from trying to doing rarely comes from working harder. Most people who are stuck are already working hard. The shift comes from a clear, committed decision about what you're giving yourself to. A yes, spoken. Your time, your energy, and your choices start to follow it.",
      "So today we're not fixing anything. We're naming. Where are you trying? Where have you been circling something for months, or years, without fully committing?",
    ],
    scripture: { ref: "James 2:17", text: "Even so faith, if it hath not works, is dead, being alone." },
    reflection: "Faith was never meant to sit still. Believing something is the starting line, not the finish line. Your belief is asking to be given legs.",
    prompts: [
      "Where in my life am I \"trying\"? List everything that comes to mind, big or small.",
      "Which one of these do I think about most often?",
    ],
    step: "Circle the one area from your list that feels the heaviest. That's the one we'll keep in view for the next 21 days.",
  },
  {
    n: 2, title: "Busy but Not Moving", line: "Busy can be a hiding place.",
    reading: [
      "The first sign of trying is the hardest one to see, because it looks so good from the outside. Busy.",
      "For a long season, my days were full. My calendar was full. I went to bed tired every night, and I could have told you a dozen things I'd done that day. But if you had asked me whether I was any closer to the thing I said mattered most, I would have gone quiet.",
      "Busy lets you feel productive while you avoid the one task that would actually move you forward. You answer every email, you help with every project, you reorganize the closet, and somehow the important thing waits another week.",
      "It isn't laziness. Busy people are rarely lazy. Often busy is a way of staying safe. If I'm always doing something, nobody can say I'm not trying, including me. And if I never get to the important thing, I never have to find out whether it works.",
      "Today, look at your week honestly. Not to shame yourself, but to see clearly. How much of your energy went to the thing you circled yesterday? How much went to everything else?",
    ],
    scripture: { ref: "Luke 10:41-42", text: "Martha, Martha, thou art careful and troubled about many things: But one thing is needful." },
    reflection: "Martha wasn't doing anything wrong. She was serving. But she was so busy with many things that she missed the one thing. What is your one thing?",
    prompts: [
      "What filled my time this past week? Write down the big blocks.",
      "What is the one task I keep moving to next week? What am I afraid will happen if I do it?",
    ],
    step: "Put 30 minutes on your calendar this week for the one thing. Give it a real time and a real place, like an appointment you would keep for someone else.",
  },
  {
    n: 3, title: "Planning as Protection", line: "Good planning ends in a first step.",
    reading: [
      "I love a plan. A fresh notebook, a color-coded calendar, a new list. Planning feels like progress, and sometimes it is.",
      "But I had to admit something uncomfortable. I had been planning the same thing for years. I'd revise the plan, research a little more, take another course, and start the plan over. It felt responsible. It was actually protection.",
      "Good planning ends in a first step. If your planning never ends, it isn't planning anymore. It's a way to stay close to your dream without ever risking it.",
      "Here's how to tell the difference. Real planning gets smaller and more specific as you go, until it turns into something you can do on a Tuesday. Protective planning gets bigger and more complicated, so there's always one more thing to figure out before you can begin.",
      "You will never have all the information. Nobody does. At some point the next piece of information only comes from doing the thing. The market tells you. The people tell you. Your own experience tells you. But only after you begin.",
    ],
    scripture: { ref: "Ecclesiastes 11:4", text: "He that observeth the wind shall not sow; and he that regardeth the clouds shall not reap." },
    reflection: "If you wait for perfect weather, you'll never plant. The conditions are rarely perfect. The harvest comes to the one who sows anyway.",
    prompts: [
      "How long have I been planning the thing I circled on Day 1? What have I done more than once?",
      "What is the smallest version of my plan that I could actually start this week?",
    ],
    step: "Close the notebook for a day. Write one sentence that starts with \"This week I will...\" and make it something you can finish in under an hour.",
  },
  {
    n: 4, title: "Waiting to Be Ready", line: "Ready shows up after you begin.",
    reading: [
      "I waited to feel ready for years. I thought one morning I would wake up confident, with all the answers, and then I would start.",
      "Ready never came first. It showed up after I started.",
      "Ready is usually a feeling that shows up after you begin, not before. Think about the first time you drove a car, held a newborn, or walked into a new job. You weren't ready. You became ready by doing it, badly at first, and then a little better.",
      "Waiting to be ready sounds wise, but it often hides a fear: if I start before I'm ready, I might fail, and people will see. So we wait for a feeling that can only come from the very thing we're avoiding.",
      "There's an old line I come back to often. You don't have to be great to start, but you have to start to be great. Your readiness is on the other side of your first step. It's waiting for you there, not here.",
    ],
    scripture: { ref: "Exodus 4:12", text: "Now therefore go, and I will be with thy mouth, and teach thee what thou shalt say." },
    reflection: "Moses gave God every reason he wasn't ready. God didn't argue with the list. He said go, and promised to meet him along the way. The help came with the going.",
    prompts: [
      "What am I waiting to feel before I start? Confident? Qualified? Approved?",
      "If I knew readiness would come after I started, what would I do this week?",
    ],
    step: "Do one thing today before you feel ready. Send the message, make the call, or write the first paragraph. Notice how you feel after.",
  },
  {
    n: 5, title: "Carrying Everyone Else", line: "You can hold others up and still steward your own calling.",
    reading: [
      "To my fellow helpers, fixers, and the ones everybody leans on: I see you, because I've been you.",
      "I was the one people called. I showed up for every need, held every hand, and helped build other people's dreams. I'm proud of that. But I also noticed that carrying everyone else had become a very respectable way of not carrying my own calling.",
      "Nobody questions you when you're helping. Helping is good. It's needed. But it can also become a place to hide, because as long as everyone else needs you, you never have time for the thing that's yours.",
      "You were not created only to hold up other people's dreams. Your gifts are meant to serve others, and you're also allowed to steward what was placed in your own hands.",
      "This isn't about caring less. It's about caring for yourself and your calling with the same faithfulness you give everyone else. Some of what you carry belongs to you. Some of it belongs to someone else, and you've been holding it because it was easier than asking them to.",
    ],
    scripture: { ref: "Galatians 6:5", text: "For every man shall bear his own burden." },
    reflection: "The same chapter tells us to bear one another's burdens. Both are true. We help each other, and each of us is still responsible for our own load. Carrying everything for everyone isn't love. It can keep others from growing, too.",
    prompts: [
      "Who and what am I carrying right now? List the people, roles, and responsibilities.",
      "Which of these are truly mine to carry? Which could I hand back, share, or set down?",
    ],
    step: "Hand one thing back this week. Ask for help with one task, or let someone else handle something you usually take on without being asked.",
  },
  {
    n: 6, title: "Quietly Doubting", line: "Doubt is a feeling, not a fact.",
    reading: [
      "Some doubt is loud. Mine was quiet. It didn't stop me in dramatic ways. It just whispered, at the edge of every good idea: Who do you think you are? What if it doesn't work? Maybe someone else should do this.",
      "Quiet doubt is dangerous because it sounds reasonable. It doesn't feel like fear. It feels like being realistic. So you never challenge it, and it quietly makes your decisions for you.",
      "Here's what helped me. Doubt is a feeling, not a fact. It can come along for the ride. It just doesn't get to drive.",
      "You don't have to wait for doubt to disappear before you move. Most people doing meaningful work still doubt sometimes. The difference is they've stopped treating the doubt as a verdict. They notice it, name it, and keep going anyway.",
      "Something else worth sitting with: sometimes we keep falling short because, somewhere inside, we've prepared to lose. We've already rehearsed the disappointment. What would change if you prepared to win instead?",
    ],
    scripture: { ref: "Mark 9:24", text: "Lord, I believe; help thou mine unbelief." },
    reflection: "This father believed and doubted at the same time, and he said both out loud. Jesus still helped him. You don't need perfect faith to take a step. You can bring your doubt with you.",
    prompts: [
      "What does my quiet doubt say? Write the exact words, as if it were speaking.",
      "What evidence do I have that the doubt is wrong? Think of times I did something I wasn't sure I could do.",
    ],
    step: "Write one sentence of truth to answer your doubt. Put it somewhere you'll see it every morning this week.",
  },
  {
    n: 7, title: "Hearing God and Still Not Moving", line: "Sometimes the next word is the one you've already been given.",
    reading: [
      "This is the sign I'm most honest about, because it was mine. I heard God clearly. I knew what I was supposed to do. And I still didn't move.",
      "I prayed for more direction. I asked for a sign, then another. I told myself I was being careful, waiting for confirmation. But if I'm truthful, at some point asking for more direction had become a way of avoiding the direction I already had.",
      "Be so in tune with God that when you hear Him say yes, you shift into a doing mindset. Not more asking. Not more waiting. Doing.",
      "This week you've looked at six signs of trying: being busy but not moving, planning as protection, waiting to be ready, carrying everyone else, quietly doubting, and hearing God and still not moving. You've probably seen yourself in more than one. That doesn't mean something is wrong with you. It means you're ready to hear it.",
      "So let's end this week with the question underneath all the others. What have you already heard?",
    ],
    scripture: { ref: "James 1:22", text: "But be ye doers of the word, and not hearers only, deceiving your own selves." },
    reflection: "Hearing is a gift. But hearing alone can fool us into thinking we've obeyed. The word you've received is asking to be lived, not just remembered.",
    prompts: [
      "What have I already heard, felt, or known that I haven't acted on?",
      "Looking back at this week, which sign of trying is strongest in me right now? What is it protecting me from?",
    ],
    step: "Write down, in one sentence, what you've already heard. Don't edit it or soften it. Then say it out loud once.",
  },

  // ---------------- WEEK 2: CLEAR IT ----------------
  {
    n: 8, title: "Every Yes Is Also a No", line: "A no isn't a rejection of people. It's a protection of purpose.",
    reading: [
      "Welcome to Week 2. Last week you heard where you've been circling. This week we make room for something new.",
      "Here's the truth that changed how I see my calendar. Every yes is also a no to something else. When I said yes to one more committee, I was saying no to an evening with my own work. When I said yes to one more favor, I was saying no to rest. The no was happening either way. The only question was whether I was choosing it on purpose.",
      "Saying no used to feel selfish to me. Now I see it as stewardship. My time, my energy, and my attention are not unlimited, and they were given to me for a purpose. Protecting them isn't selfish. It's faithful.",
      "A no isn't a rejection of people. It's a protection of purpose.",
      "This week isn't about saying no to everything. It's about clearing space, on purpose, for the yes that's yours. Before you can add, you often have to subtract.",
    ],
    scripture: { ref: "Ecclesiastes 3:1", text: "To every thing there is a season, and a time to every purpose under the heaven." },
    reflection: "Not everything good is for this season. Some things are for later. Some were for before. Knowing your season helps you know what to set down.",
    prompts: [
      "What have I said yes to recently that I wish I hadn't? What did each yes cost me?",
      "If I could clear one thing from my plate this month, what would make the most room?",
    ],
    step: "Look at your calendar for the next two weeks. Find one commitment you can cancel, shorten, or hand off, and do it.",
  },
  {
    n: 9, title: "What Am I Chasing?", line: "Some things look like progress but pull us off our path.",
    reading: [
      "Some things look like progress but pull us off our path. A title that sounds impressive. A goal someone else set for us. An opportunity that's good, just not ours.",
      "I've chased things because they looked like success, and when I got them, they felt empty. Not because they were bad, but because they were never mine. I had borrowed someone else's idea of what my life should look like.",
      "Here's a gut check I use now: if nobody ever knew you did it, would you still want it? If the applause disappeared, the likes, the approval, the \"I'm so proud of you,\" would it still matter to you?",
      "If it requires you to shrink, shape-shift, or abandon yourself, it isn't yours. What's meant for you will fit who you are.",
      "Today, be honest about what you're chasing. You don't have to drop it all at once. Just see it clearly. Some of it will pass the gut check. Some of it won't. That's important information.",
    ],
    scripture: { ref: "Galatians 1:10", text: "For do I now persuade men, or God? or do I seek to please men? for if I yet pleased men, I should not be the servant of Christ." },
    reflection: "Paul knew that trying to please everyone would pull him away from his calling. The approval of people is a moving target. Your calling isn't.",
    prompts: [
      "What am I chasing right now? Is it mine, or someone else's idea of success?",
      "If nobody ever knew I did it, which of these would I still want?",
    ],
    step: "Choose one thing you've been chasing for someone else's approval. Write down what it would feel like to let it go, then take one step toward letting it go.",
  },
  {
    n: 10, title: "Rest Sustains Your Yes", line: "Rest isn't a reward. It's what keeps your yes alive.",
    reading: [
      "For a long time, I treated rest like dessert. Something I could have after everything else was finished, after everyone else was taken care of. And of course, everything else was never finished.",
      "Rest isn't a reward you earn after everyone else is taken care of. It's what keeps your yes alive.",
      "Here's why this matters for the right yes. A yes said from exhaustion is fragile. You can say it, but you can't sustain it. When you're running on empty, every new commitment feels heavy, even the good ones. Even the ones that are yours.",
      "Growth doesn't have to come at the cost of your peace. You don't have to burn out to prove you care. In fact, the people who last in meaningful work are often the ones who learned to rest before they collapsed, not after.",
      "Today, clearing space means making room for rest. Not as a luxury, and not as a reward. As part of the plan.",
    ],
    scripture: { ref: "Mark 6:31", text: "Come ye yourselves apart into a desert place, and rest a while: for there were many coming and going, and they had no leisure so much as to eat." },
    reflection: "The needs were real and the crowds were still coming. Jesus called His disciples to rest anyway. Rest wasn't a distraction from the work. It was part of it.",
    prompts: [
      "When did I last truly rest, not just stop working, but feel restored? What was I doing?",
      "What gets in the way of my rest? What do I believe will happen if I stop?",
    ],
    step: "Schedule one block of real rest this week, at least an hour, and protect it like a meeting. No catching up allowed.",
  },
  {
    n: 11, title: "A Burden That Fits", line: "Meaningful work can tire you out and still fill you up.",
    reading: [
      "Not all hard work is draining work. That was a surprise to me.",
      "Some of the hardest things I've done have filled me up. I came home tired, but it was a good tired, the kind that comes from pouring yourself into something that matters. Other things I did were much easier, and they left me empty for days.",
      "Meaningful work can tire you out and still fill you up. If you end most days empty, not just tired, pay attention to that. Empty is information. It may be telling you that you're carrying something that isn't yours, or carrying your own work in a way that doesn't fit you.",
      "Today, notice the difference between tired and empty in your own life. Look at the things you do each week. Which ones give something back, even when they're hard? Which ones only take?",
      "The right yes isn't always easy. But it usually fits. It's a burden you were shaped to carry.",
    ],
    scripture: { ref: "Matthew 11:30", text: "For my yoke is easy, and my burden is light." },
    reflection: "A yoke is made to fit the one who wears it. Jesus doesn't promise no burden. He promises one that fits. If what you're carrying is crushing you, it may be time to ask whose yoke it really is.",
    prompts: [
      "What in my week leaves me tired but full? What leaves me empty?",
      "What would change if I spent more of my energy on what fills me, and less on what empties me?",
    ],
    step: "Pick one thing on your \"empty\" list. Decide whether to drop it, change it, or do it differently, and make that change this week.",
  },
  {
    n: 12, title: "If Nothing Changes", line: "Prepare to win, not to lose.",
    reading: [
      "This one is uncomfortable, and that's the point.",
      "If nothing changes, where will you be one year from today? Same job, same worry, same plan in the same notebook. Same conversation you keep meaning to have. Same \"one day.\"",
      "I don't ask this to scare you. I ask because sometimes we don't move until staying the same becomes more painful than changing. And often we don't feel that pain because we've never let ourselves look at it directly.",
      "Now do the other half. Picture where you could be one year from today if you started this week. Not if everything went perfectly. Just if you started, and kept going, one small step at a time.",
      "Many of us have prepared to lose. We've rehearsed the disappointment so we won't be surprised by it. But you can prepare to win instead. You can let yourself picture it working. That isn't arrogance. It's faith with its eyes open.",
    ],
    scripture: { ref: "Isaiah 43:18-19", text: "Remember ye not the former things, neither consider the things of old. Behold, I will do a new thing; now it shall spring forth; shall ye not know it?" },
    reflection: "God doesn't only speak of a new thing someday. He says now. Something is already springing forth. The question is whether we'll notice it and step into it.",
    prompts: [
      "If nothing changes, where will I be one year from today? Be specific.",
      "If I started this week, where could I be one year from today?",
    ],
    step: "Write a short note to yourself, dated one year from today, describing the life you're building. Seal it or save it where you'll find it.",
  },
  {
    n: 13, title: "What Keeps Me Stuck", line: "I don't have to shrink or shape-shift to belong.",
    reading: [
      "When I ask women what keeps them stuck, the answers are almost always one of four things. Fear of failing. Too many yeses. Waiting to be ready. Other people's opinions.",
      "We've already talked about waiting to be ready and too many yeses. Today let's sit with the other two, because they're often the deepest.",
      "Fear of failing tells you that if you try and it doesn't work, it will prove something terrible about you. But failing at something is not the same as being a failure. Every person you admire has a long list of things that didn't work. They just didn't let the list decide who they were.",
      "Other people's opinions can be even louder. What will my family say? What will people at church think? What if they think I've gotten too big for myself? So we shrink. We shape-shift. We make ourselves smaller so nobody feels uncomfortable.",
      "You don't have to shrink or shape-shift to belong. The people who are truly for you will make room for you to grow. And the ones who don't were never meant to hold the pen on your story.",
    ],
    scripture: { ref: "2 Timothy 1:7", text: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind." },
    reflection: "Fear is real, but it isn't from God, and it isn't in charge. You've been given power to act, love to guide you, and a sound mind to decide well.",
    prompts: [
      "Which of the four keeps me stuck most: fear of failing, too many yeses, waiting to be ready, or other people's opinions?",
      "Whose opinion am I most afraid of? What would I do if I knew they would understand?",
    ],
    step: "Tell one safe person about your right yes, even if it's still forming. Choose someone who will cheer for you.",
  },
  {
    n: 14, title: "A No Is a Complete Sentence", line: "Kind. Clear. No paragraph of reasons required.",
    reading: [
      "For years, I over-explained every no. Long messages. Extra apologies. A whole paragraph of reasons, as if I needed permission to protect my own time. It left me exhausted, and I still felt guilty.",
      "Here's what I learned. A no is a complete sentence. You can be kind without being over-explained.",
      "Over-explaining usually comes from wanting the other person to agree that our no is okay. But you don't need their agreement. You need to be clear and kind. That's all.",
      "Here are four ways to say it with grace. Read them out loud. Pick the one that sounds most like you, and practice it until it feels natural.",
      "\"Thank you for thinking of me. I'm not able to take this on.\" \"That's not something I can commit to right now.\" \"I'm protecting my time for a few priorities this season, so I'll pass.\" \"I can't do that, but I can do this smaller thing.\"",
      "Peace sometimes comes from finally agreeing with yourself.",
    ],
    scripture: { ref: "Matthew 5:37", text: "But let your communication be, Yea, yea; Nay, nay: for whatsoever is more than these cometh of evil." },
    reflection: "Jesus invites simple, honest words. A clear yes. A clear no. You don't have to build a case. Your word can stand on its own.",
    prompts: [
      "Where do I need to say no right now? Who do I need to say it to?",
      "Which of the four scripts feels most like me? Write my own version.",
    ],
    step: "Say one no this week, using one of the scripts. Don't add a paragraph of reasons. Notice how it feels afterward.",
  },

  // ---------------- WEEK 3: SAY IT ----------------
  {
    n: 15, title: "How Do I Know It's the Right Yes?", line: "Not every open door is your door.",
    reading: [
      "\"How do I know it's the right yes?\" It's the question I hear most.",
      "Not every good idea is your idea. Not every open door is your door. So how do you tell the difference? The right yes usually has most of these six marks.",
      "It keeps coming back. You've set it down, and it finds you again. It fits who you are. It lines up with your values, your gifts, and the person you're becoming. It brings peace, even when it's scary. Fear and peace can live side by side, and the right yes often has both.",
      "It serves more than you. Somebody else is better off because you said it. You'd want it without the applause. It isn't about proving anything. And it costs something. A right yes almost always requires a no somewhere else.",
      "Now notice what isn't on this list. Certainty. Perfect timing. Everyone's approval. Those rarely come first. If you're waiting for them, you may wait forever.",
      "Today, bring the yes that keeps coming back to you, and hold it up against these six marks.",
    ],
    scripture: { ref: "Isaiah 30:21", text: "And thine ears shall hear a word behind thee, saying, This is the way, walk ye in it, when ye turn to the right hand, and when ye turn to the left." },
    reflection: "The guidance comes as you walk, not before you start. You hear \"this is the way\" while you're turning. Direction meets you in motion.",
    marks: ["It keeps coming back.", "It fits who I am.", "It brings peace, even when it's scary.", "It serves more than me.", "I'd want it without the applause.", "It costs something."],
    prompts: [
      "What is the yes that keeps coming back to me? Name it in one sentence.",
    ],
    step: "Check each mark your yes has. If it has most of them, write \"This is my right yes\" next to it. If it doesn't yet, write what's missing.",
  },
  {
    n: 16, title: "Peace Without Explanation", line: "The right yes brings a peace you don't have to defend.",
    reading: [
      "You'll know the right yes because it brings peace without explanation. You don't have to overthink it or defend it. It just feels right, deep down, even if the details aren't clear yet.",
      "That doesn't mean you won't be nervous. You probably will be. Peace isn't the absence of fear. It's a settledness underneath the fear, a quiet knowing that says, This is mine to do.",
      "Some yeses come with a lot of noise. Pressure, urgency, someone else's excitement. Those can feel like peace at first, but they fade fast. The right yes is usually quieter. It stays.",
      "If you're not sure, try this. Get still. Take a few slow breaths. Picture yourself having said yes, six months from now. Notice what happens in your body. Do you feel tight, heavy, trapped? Or is there a steadiness, maybe even relief?",
      "Your body often knows before your mind catches up. Listen to it.",
    ],
    scripture: { ref: "Philippians 4:7", text: "And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus." },
    reflection: "This peace passes understanding. You won't always be able to explain it to others. You don't have to. It's meant to keep you, not convince them.",
    prompts: [
      "When I picture myself having said yes, six months from now, what do I feel?",
      "Where in my life have I felt peace without explanation before? What did I learn from it?",
    ],
    step: "Spend five quiet minutes with your yes today. No phone, no planning. Just sit with it and notice what you feel.",
  },
  {
    n: 17, title: "Someone Needs What You Carry", line: "Somebody is on the other side of your yes.",
    reading: [
      "When the needs in front of you match the gifts inside you, pay attention.",
      "It's easy to think of our yes as something just for us. A dream, a goal, a personal project. But almost every right yes serves more than the person who says it. There's a client who needs what you know. A child who needs to see you do it. A woman who needs to hear your story so she knows she isn't alone.",
      "Somebody is on the other side of your yes.",
      "This matters, because when it gets hard, and it will, remembering who you're doing it for can carry you through. You're not just building something. You're showing up for someone.",
      "Your gifts aren't accidental. The things that come easily to you, the things people always ask you for help with, the things you can't stop caring about, those are clues. They were placed in your hands for a reason.",
    ],
    scripture: { ref: "1 Peter 4:10", text: "As every man hath received the gift, even so minister the same one to another, as good stewards of the manifold grace of God." },
    reflection: "Your gift was given to be given away. Being a good steward means not burying it out of fear, but putting it to work for others.",
    prompts: [
      "What gifts do people come to me for? What comes easily to me that others find hard?",
      "Who is on the other side of my yes? Who will be better off because I said it?",
    ],
    step: "Write the name of one person, or one kind of person, your yes will serve. Keep their name where you'll see it.",
  },
  {
    n: 18, title: "I Am, Not I'm Becoming", line: "My yes is my activation.",
    reading: [
      "There's a small change in language that made a big difference for me. I stopped saying \"I'm becoming\" and started saying \"I am.\"",
      "\"I'm becoming a business owner\" kept it in the future, always one step away. \"I am a business owner\" asked me to act like one today. Everything I'm doing now reflects who I am.",
      "This isn't pretending. It's agreeing with what you've already decided. You don't wait until the dream is fully built to claim it. You claim it, and then you build it.",
      "Your yes is your activation. It's the moment trying becomes doing. Not someday. Not when it's perfect. Now.",
      "Try it today. Take the yes you named this week and turn it into an \"I am\" statement. I am a writer. I am someone who speaks up. I am building this. Say it out loud. It may feel strange at first. Say it again anyway.",
    ],
    scripture: { ref: "Joshua 1:9", text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whither soever thou goest." },
    reflection: "Joshua was stepping into a role he'd watched someone else hold for years. God didn't tell him he was becoming a leader. He told him to be strong now, and promised to go with him.",
    prompts: [
      "My \"I am\" statement for my right yes is:",
      "What would someone who truly is this do this week? What would she stop doing?",
    ],
    step: "Say your \"I am\" statement out loud three times today: once in the morning, once at midday, and once before bed.",
  },
  {
    n: 19, title: "Don't Despise the Small Beginning", line: "You don't need the big version. You need the first step.",
    reading: [
      "One conversation. One client. One step. Every harvest started as a seed.",
      "When we finally say yes, we often picture the big version right away. The full business, the finished book, the whole new life. And when we compare our first small step to that big picture, the step feels pointless. So we don't take it.",
      "You don't need the big version. You need the first step.",
      "Small beginnings aren't a sign that you're doing it wrong. They're how everything real begins. The tree doesn't skip the seed. The building doesn't skip the foundation. And you don't have to skip the small, unglamorous first steps either.",
      "I bloom at my own pace. So can you. Your timeline doesn't have to look like anyone else's. What matters is that you're moving.",
    ],
    scripture: { ref: "Zechariah 4:10", text: "For who hath despised the day of small things?" },
    reflection: "The people were discouraged because the new temple looked so small compared to the old one. God's answer: don't look down on small beginnings. He sees what they will become.",
    prompts: [
      "What is the smallest possible first step toward my right yes?",
      "What small beginnings in my past grew into something I'm grateful for?",
    ],
    step: "Take your smallest first step today. Not tomorrow. Today. Then write down that you did it.",
  },
  {
    n: 20, title: "Write the Vision", line: "Write it down. Make it plain.",
    reading: [
      "A written vision gives you something to run with on the days you forget why you started. And there will be days like that.",
      "When the excitement fades, when it gets hard, when someone doubts you, or you doubt yourself, you need something to come back to. Not a feeling. Words on a page, in your own handwriting, that remind you what you said yes to and why.",
      "Today, write your vision. Keep it plain. It doesn't have to be poetic or impressive. It has to be true and clear enough that you could read it on a hard day and remember.",
      "Write what you're saying yes to. Write why it matters to you. Write who it serves. Write what it will look like a year from now if you keep going. And write what you're willing to let go of to make room for it.",
      "Then put it somewhere you'll see it. On the mirror. In your Bible. On the first page of a new notebook. Somewhere it can keep speaking to you.",
    ],
    scripture: { ref: "Habakkuk 2:2", text: "And the LORD answered me, and said, Write the vision, and make it plain upon tables, that he may run that readeth it." },
    reflection: "The vision is written so the one who reads it can run. Plain words give you something to carry when the road gets long.",
    prompts: [
      "My vision, in plain words: what I'm saying yes to, and why it matters.",
      "One year from now, if I keep going, my life looks like this:",
    ],
    step: "Copy the most important sentence of your vision onto a card or sticky note, and put it where you'll see it every day.",
  },
  {
    n: 21, title: "Go Forward", line: "I choose now.",
    reading: [
      "The sea was in front of them and the enemy was behind them, and God said: go forward.",
      "Sometimes the next word you're waiting for is the one you've already been given. You've heard it. You've cleared space for it. You've tested it and written it down. Now there's only one thing left to do.",
      "Say it.",
      "Today you'll sign your right yes. On the next page, write what you're saying yes to, why, what you're saying no to, your first three steps, and the person who will walk with you. Then sign it and date it. Not because a signature makes it magic, but because a decision written down and signed is harder to wander away from.",
      "Twenty-one days ago you named where you were trying. Today you choose doing. It may still feel scary. It probably will. Fear and peace can live side by side. Go forward anyway.",
      "All it takes is the right yes to go from trying to doing. This is yours. I'm so proud of you for saying it.",
    ],
    scripture: { ref: "Exodus 14:15", text: "And the LORD said unto Moses, Wherefore criest thou unto me? speak unto the children of Israel, that they go forward." },
    reflection: "There comes a moment when it's no longer time to pray about whether to move. It's time to move. The way opened as they stepped forward.",
    prompts: [
      "Looking back over 21 days, what has changed in me?",
      "What will I do in the next 24 hours to act on my right yes?",
    ],
    step: "Fill in and sign your Right Yes commitment on the next page. Then tell the person walking with you that you signed it.",
  },
];

export const COMMIT = [
  "My right yes is",
  "I'm saying yes because",
  "To make room, I'm saying no to",
  "My first three steps",
  "The person walking with me",
];

export const AFFIRMATIONS = [
  "All it takes is the right yes to go from trying to doing.",
  "My yes is my activation.",
  "I am, not I'm becoming.",
  "I prepare to win, not to lose.",
  "I no longer chase what is not for me.",
  "I don't have to shrink or shape-shift to belong.",
  "I bloom at my own pace.",
  "I choose now.",
];

/** The group version, used at the Reset Circle and any circle or workshop. About 45 minutes. */
export const CIRCLE = {
  title: "The Right Yes Circle",
  sub: "The whole practice in one sitting, for circles, retreats, and workshops. About 45 minutes.",
  steps: [
    {
      name: "Hear It", minutes: 12,
      lead: "Get quiet and honest about where you've been circling.",
      do: [
        "Take three slow breaths together.",
        "On your own, list everywhere you're \"trying\": in work, family, health, faith, and dreams. Big or small. (5 minutes)",
        "Circle the one that feels heaviest.",
        "Read the six signs of trying out loud as a group: busy but not moving, planning as protection, waiting to be ready, carrying everyone else, quietly doubting, hearing God and still not moving. Mark the one that sounds most like you.",
      ],
    },
    {
      name: "Clear It", minutes: 13,
      lead: "Every yes is also a no. Choose your no on purpose.",
      do: [
        "Write down what your heaviest area would need room for: time, energy, money, or attention.",
        "Name one thing you will say no to, or set down, to make that room.",
        "Pick one of the four no scripts and say your no out loud to a partner: \"Thank you for thinking of me. I'm not able to take this on.\" \"That's not something I can commit to right now.\" \"I'm protecting my time for a few priorities this season, so I'll pass.\" \"I can't do that, but I can do this smaller thing.\"",
      ],
    },
    {
      name: "Say It", minutes: 15,
      lead: "Name your right yes, test it, and speak it.",
      do: [
        "Write your yes in one sentence.",
        "Check it against the six marks: it keeps coming back, it fits who you are, it brings peace even when it's scary, it serves more than you, you'd want it without the applause, it costs something.",
        "Turn it into an \"I am\" statement.",
        "With your partner, take turns saying your \"I am\" statement out loud, twice. The partner answers, \"I believe you.\"",
      ],
    },
    {
      name: "Go Forward", minutes: 5,
      lead: "Close the circle with a first step.",
      do: [
        "Write one step you'll take in the next 24 hours.",
        "Go around the circle. Each woman says just her \"I am\" statement. No explaining needed.",
        "Take the guide home and begin Day 1 this week. Your right yes becomes your one priority for the next 90 days.",
      ],
    },
  ],
  card: ["Where I've been trying", "The no that makes room", "My right yes", "My \"I am\" statement", "My first step in the next 24 hours"],
};

export const CLOSING = [
  "You did it. Twenty-one days of hearing, clearing, and saying. Whether you finished every page or picked up where you were on the hard days, you showed up for yourself. That matters.",
  "Your right yes will need care to grow. Come back to your commitment page often. Read your vision on the days you forget why you started. Rest so your yes can last. And when a new season comes, and it will, walk through these pages again. A new season often brings a new yes.",
  "If you'd like someone to walk with you, that's what we do at Build & Bloom. We help women turn a yes into a plan, and a plan into a life and a business that last, without losing themselves along the way.",
];
