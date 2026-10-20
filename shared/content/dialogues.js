// Dialogue trees. All dialogue is original game writing about fictional characters.
// Scripture is never quoted inside dialogue text: nodes list `scripture` references and the
// game shows the actual verse text (World English Bible) in a separate, labelled card.
//
// Choice kinds: listen, ask, explain, scripture, help, invite, pray, respect, gift, pushy, smalltalk, end
// Effects: see engine/effects.js. `stage: n` also stamps flag `<npc>_s<n>` with the current time.

const END = { id: 'bye', text: 'Take care. See you around.', kind: 'end', end: true };

export const DIALOGUES = {
  // ───────────────────────────── CHIDI — the sceptical student ─────────────────────────────
  chidi_intro: {
    npc: 'chidi',
    start: 'a',
    nodes: {
      a: {
        text: 'Ah, sorry — I nearly walked into you. My head is full of compiler errors. Final-year project. And everyone keeps saying AI will take all our jobs before we even graduate.',
        choices: [
          { id: 'listen', kind: 'listen', text: 'That sounds like a lot. What is the project about?', effects: [{ trust: 6 }, { met: true }, { stage: 1 }], next: 'b' },
          { id: 'ask', kind: 'ask', text: 'Are you really worried about the AI thing?', effects: [{ trust: 4 }, { met: true }, { stage: 1 }], next: 'c' },
          { id: 'pushy', kind: 'pushy', text: 'You need Jesus more than you need a job, my brother.', effects: [{ trust: -6 }, { met: true }, { stage: 1 }, { counter: 'pushyWitness' }], next: 'd' },
          { id: 'end', kind: 'end', text: 'Good luck with it!', effects: [{ met: true }, { stage: 1 }], end: true },
        ],
      },
      b: {
        text: 'An app that helps market traders track stock with just a phone camera. My aunty sells at Oja — she inspired it. Problem is, it crashes every time the light goes off. Like everything in this city, abi?',
        choices: [
          { id: 'enc', kind: 'listen', text: 'Building something for your aunty — that is a good reason to keep going.', effects: [{ trust: 4 }, { xp: 10 }], next: 'e' },
          END,
        ],
      },
      c: {
        text: 'Some days. My parents spent everything on my fees. If there are no jobs at the end of this, what was it all for?',
        choices: [
          { id: 'honest', kind: 'listen', text: 'I do not know what the job market will do. But you are not only your job.', effects: [{ trust: 4 }], next: 'e' },
          END,
        ],
      },
      d: {
        text: '…Okay. Nice to meet you too. (He laughs, but the conversation cools.) I have a class.',
        choices: [{ id: 'sorry', kind: 'respect', text: 'Sorry — that came out wrong. I am new around here.', effects: [{ trust: 3 }], end: true }, END],
      },
      e: {
        text: 'Anyway — I am Chidi. You can usually find me in the Learning Centre or on the lawn after four. Come and stop me from throwing my laptop into the gutter.',
        choices: [{ id: 'ok', kind: 'end', text: 'Deal. See you around, Chidi.', end: true }],
      },
    },
  },
  chidi_smalltalk: {
    npc: 'chidi',
    start: 'a',
    nodes: {
      a: {
        text: 'Ah, my person! The project still dey crash but less now. What is happening with you?',
        choices: [
          { id: 'study', kind: 'help', text: 'Want to study together for an hour?', requires: { stat: { name: 'energy', gte: 15 } }, effects: [{ time: 60 }, { energy: -10 }, { trust: 5 }, { skill: 'communication', amount: 1 }, { setFlag: 'chidi_helped' }, { counter: 'serviceActs' }, { event: 'service', kind: 'study_help' }], next: 'thanks' },
          { id: 'food', kind: 'gift', text: 'Here — I bought you some suya.', requires: { hasItem: 'suya' }, effects: [{ takeItem: 'suya' }, { trust: 4 }, { setFlag: 'chidi_helped' }], next: 'thanks' },
          { id: 'chat', kind: 'smalltalk', text: 'Just passing. Keep pushing!', effects: [{ trust: 1 }], end: true },
        ],
      },
      thanks: { text: 'You are a good one. Seriously. Thank you.', choices: [{ id: 'ok', kind: 'end', text: 'Anytime.', end: true }] },
    },
  },
  chidi_beliefs: {
    npc: 'chidi',
    start: 'a',
    nodes: {
      a: {
        text: 'Can I ask you something? I saw you coming out of Grace Chapel. My mum is a big church woman. Me, I stopped going. Faith feels like something you do so you do not have to think. No offence.',
        choices: [
          { id: 'ask', kind: 'ask', text: 'None taken. What made you stop going?', effects: [{ trust: 6 }], next: 'why' },
          { id: 'explain', kind: 'explain', text: 'For me, faith is not switching off my brain. It is trusting someone I have good reasons to trust.', effects: [{ trust: 3 }, { counter: 'conversations' }], next: 'reasons' },
          { id: 'pushy', kind: 'pushy', text: 'That is exactly what the devil wants you to think.', effects: [{ trust: -8 }, { counter: 'pushyWitness' }], next: 'cold' },
        ],
      },
      why: {
        text: 'Too many sermons about money. Too many "just believe". When my cousin died, people told me it was God’s will and asked me to stop crying. I was fifteen.',
        choices: [
          { id: 'sorry', kind: 'listen', text: 'I am really sorry. That should not have been the answer you got.', effects: [{ trust: 8 }, { stage: 2 }, { counter: 'conversations' }, { counter: 'respectfulWitness' }], next: 'end' },
        ],
      },
      reasons: {
        text: 'Hmm. "Good reasons." I would like to hear them one day. Not today — I have a lab in ten minutes.',
        choices: [{ id: 'ok', kind: 'respect', text: 'Whenever you are ready.', effects: [{ trust: 3 }, { stage: 2 }, { counter: 'respectfulWitness' }], end: true }],
      },
      cold: {
        text: 'Wow. Okay. This is exactly what I mean. Let us not talk about religion for a while, please.',
        choices: [{ id: 'resp', kind: 'respect', text: 'Fair. I am sorry. We will talk about other things.', effects: [{ setFlag: 'chidi_pause' }, { trust: 2 }], end: true }],
      },
      end: {
        text: 'You are the first church person who did not argue with me about that. Thank you. Maybe we can talk more another day.',
        choices: [{ id: 'ok', kind: 'end', text: 'I would like that.', end: true }],
      },
    },
  },
  chidi_paused: {
    npc: 'chidi',
    start: 'a',
    nodes: {
      a: {
        text: 'Hey. Still on for football at the square on Saturday?',
        choices: [
          { id: 'yes', kind: 'respect', text: 'Of course. (You keep things light, as he asked.)', effects: [{ trust: 4 }, { counter: 'respectfulWitness' }, { clearFlag: 'chidi_pause' }], end: true },
          { id: 'push', kind: 'pushy', text: 'Before that — we really need to finish our talk about God.', effects: [{ trust: -10 }, { counter: 'pushyWitness' }, { setFlag: 'chidi_pause' }], next: 'b' },
        ],
      },
      b: { text: 'I asked you for some space. Please.', choices: [{ id: 'ok', kind: 'respect', text: 'You are right. Sorry.', end: true }] },
    },
  },
  chidi_suffering: {
    npc: 'chidi',
    start: 'a',
    scripture: ['Psalms 34:18', 'John 11:35'],
    nodes: {
      a: {
        text: 'I have been thinking about what we talked about. Here is my real question: if God is good, why is Udoka like this? Children selling water in traffic. My cousin. All of it.',
        choices: [
          { id: 'honest', kind: 'scripture', text: 'I do not have a neat answer. But the Bible does not hide pain — there is a psalm about God being close to the brokenhearted, and at a friend’s grave Jesus wept.', scripture: ['Psalms 34:18', 'John 11:35'], effects: [{ trust: 7 }, { setFlag: 'chidi_suffering_talk' }, { counter: 'conversations' }, { counter: 'respectfulWitness' }, { stage: 3 }], next: 'b' },
          { id: 'glib', kind: 'explain', text: 'Everything happens for a reason. Just trust God.', effects: [{ trust: -4 }, { stage: 3 }], next: 'c' },
          { id: 'listen', kind: 'listen', text: 'Tell me more about your cousin, if you want to.', effects: [{ trust: 9 }, { time: 30 }, { stage: 3 }], next: 'd' },
        ],
      },
      b: {
        text: 'Jesus wept? I did not know that was in there. That is… not what I expected from a God who supposedly controls everything.',
        choices: [
          { id: 'invite', kind: 'invite', text: 'There is a Bible study at Grace Chapel in the evenings. Questions welcome — including yours.', effects: [{ setFlag: 'chidi_invited' }, { trust: 2 }], next: 'e' },
          END,
        ],
      },
      c: { text: 'Yeah. That is what everyone says.', choices: [{ id: 'ok', kind: 'end', text: 'Sorry. That was too quick of me.', effects: [{ trust: 2 }], end: true }] },
      d: {
        text: 'His name was Ikenna. He was funny. Better at maths than me. (He talks for a while. You mostly listen.) Thank you. I have not said his name out loud in a long time.',
        choices: [{ id: 'ok', kind: 'listen', text: 'Thank you for telling me about him.', effects: [{ trust: 3 }, { counter: 'respectfulWitness' }], end: true }],
      },
      e: { text: 'Maybe. No promises. I will think about it.', choices: [{ id: 'ok', kind: 'respect', text: 'No pressure at all.', effects: [{ trust: 2 }], end: true }] },
    },
  },
  chidi_who_is_jesus: {
    npc: 'chidi',
    start: 'a',
    nodes: {
      a: {
        text: 'Okay, real talk. Who do you actually think Jesus was? Not the Sunday-school picture. You.',
        choices: [
          { id: 'explain', kind: 'explain', text: 'I believe he is who he said he was — God come close, who died for us and rose again. The Gospel of John is the best place to see why people believed that.', scripture: ['John 1:14', 'John 14:6'], effects: [{ trust: 3 }, { counter: 'conversations' }], next: 'b' },
          { id: 'ask', kind: 'ask', text: 'What do you think he was?', effects: [{ trust: 4 }], next: 'c' },
        ],
      },
      c: {
        text: 'A good teacher? A revolutionary? I honestly do not know. That is why I am asking you.',
        choices: [{ id: 'explain2', kind: 'explain', text: 'Then let me give you my honest answer — and you can push back.', effects: [{ trust: 2 }, { counter: 'conversations' }], next: 'b' }],
      },
      b: {
        text: 'Hmm. I have never actually read it myself. Only verses on calendars.',
        choices: [
          { id: 'gift', kind: 'gift', text: 'Here — keep this Bible. Start with John. Tell me what you think, even if you hate it.', requires: { hasItem: 'bible' }, effects: [{ takeItem: 'bible' }, { trust: 8 }, { setFlag: 'chidi_got_bible' }, { stage: 4 }], next: 'd' },
          { id: 'phone', kind: 'invite', text: 'You can read John on your phone. Want to compare notes in a couple of days?', effects: [{ trust: 4 }, { setFlag: 'chidi_got_bible' }, { stage: 4 }], next: 'd' },
          END,
        ],
      },
      d: { text: 'Challenge accepted. But I am reading it like a code review. If there are bugs, I am telling you.', choices: [{ id: 'ok', kind: 'end', text: 'I would expect nothing less.', end: true }] },
    },
  },
  chidi_reading: {
    npc: 'chidi',
    start: 'a',
    nodes: {
      a: {
        text: 'Still reading. Chapter 4, the woman at the well. Interesting that Jesus talks to someone everyone else avoided. Give me a few more days.',
        choices: [
          { id: 'help', kind: 'help', text: 'Need help with your project this week?', requires: { stat: { name: 'energy', gte: 15 } }, effects: [{ time: 90 }, { energy: -12 }, { trust: 6 }, { setFlag: 'chidi_helped' }, { counter: 'serviceActs' }, { event: 'service', kind: 'study_help' }], next: 'b' },
          { id: 'ok', kind: 'respect', text: 'Take your time.', effects: [{ trust: 1 }], end: true },
        ],
      },
      b: { text: 'You are a lifesaver. The app finally saves offline!', choices: [{ id: 'ok', kind: 'end', text: 'Ha! Let us go!', end: true }] },
    },
  },
  chidi_decision: {
    npc: 'chidi',
    start: 'a',
    nodes: {
      a: {
        text: 'I finished John. I have been sitting with it. Can I tell you where I am?',
        choices: [{ id: 'yes', kind: 'listen', text: 'Please. I am listening.', effects: [{ counter: 'conversations' }], next: 'branch' }],
      },
      branch: {
        text: '…',
        auto: [
          { when: { all: [{ trust: { npc: 'chidi', gte: 55 } }, { flag: 'chidi_helped' }, { counter: { name: 'pushyWitness', lt: 3 } }] }, next: 'yes_path' },
          { next: 'not_yet' },
        ],
      },
      yes_path: {
        text: 'I kept waiting for the bugs. Instead I kept meeting this Jesus who sees people. The woman at the well. The man born blind. Thomas with his doubts. I think… I want to follow him. I do not know how to do this properly.',
        choices: [
          { id: 'pray', kind: 'pray', text: 'There is no "properly". Do you want to pray together, right now, in your own words?', effects: [{ storyline: { id: 'chidi', outcome: 'conversion' } }, { stage: 6 }, { trust: 10 }], next: 'after' },
        ],
      },
      after: {
        text: 'That was… simple. And not simple at all. What happens now?',
        choices: [{ id: 'next', kind: 'invite', text: 'Now we keep going together. Come to Bible study with me — Brother Sam’s circle at Grace Chapel.', scripture: ['Acts 2:42'], effects: [{ setFlag: 'chidi_disciple_invited' }], end: true }],
      },
      not_yet: {
        text: 'I respect Jesus more than I expected to. But I am not there. I am not going to pretend to believe something just to make you happy. Can we still be friends?',
        choices: [
          { id: 'friends', kind: 'respect', text: 'Of course. Honestly, that matters more to me than you agreeing with me.', effects: [{ storyline: { id: 'chidi', outcome: 'friendship' } }, { stage: 7 }, { trust: 8 }, { counter: 'respectfulWitness' }], next: 'f2' },
          { id: 'pressure', kind: 'pushy', text: 'But what if you die tonight? You have to decide now!', effects: [{ trust: -12 }, { counter: 'pushyWitness' }, { setFlag: 'chidi_pause' }], next: 'f3' },
        ],
      },
      f2: { text: 'Good. Then football on Saturday — and you are buying the suya.', choices: [{ id: 'ok', kind: 'end', text: 'Deal.', end: true }] },
      f3: { text: 'This is why I stopped going to church. Please give me some space.', choices: [{ id: 'ok', kind: 'respect', text: 'I am sorry. I will.', end: true }] },
    },
  },
  chidi_disciple: {
    npc: 'chidi',
    start: 'a',
    nodes: {
      a: {
        text: 'I keep reading every night. I have about a hundred questions. Brother Sam says questions are welcome.',
        choices: [
          { id: 'study', kind: 'invite', text: 'Let us go to the Bible study circle together this week.', effects: [{ setFlag: 'chidi_disciple_invited' }], next: 'b' },
          END,
        ],
      },
      b: { text: 'I will meet you at the study table in Grace Chapel, evenings.', choices: [{ id: 'ok', kind: 'end', text: 'See you there.', end: true }] },
    },
  },
  chidi_after: {
    npc: 'chidi',
    start: 'a',
    nodes: {
      a: {
        text: 'My guy! I passed my defence! My aunty is already using the app at Oja. Who would have thought?',
        choices: [{ id: 'yay', kind: 'smalltalk', text: 'I am so proud of you!', effects: [{ trust: 2 }, { wellbeing: 3 }], end: true }],
      },
    },
  },

  // ───────────────────────────── EMEKA — keke driver, betting debt ─────────────────────────────
  emeka_intro: {
    npc: 'emeka',
    start: 'a',
    nodes: {
      a: {
        text: 'Keke! Keke! You dey go Oja? …Ah, sorry, I am shouting at everyone today. Bad week. I lost money on football. Arsenal betrayed me again. Now I owe a man thirty thousand.',
        choices: [
          { id: 'listen', kind: 'listen', text: 'Thirty thousand is a lot. How are you holding up?', effects: [{ trust: 7 }, { met: true }, { stage: 1 }], next: 'b' },
          { id: 'lecture', kind: 'pushy', text: 'Betting is a sin, you know. You brought this on yourself.', effects: [{ trust: -7 }, { met: true }, { stage: 1 }, { counter: 'pushyWitness' }], next: 'c' },
          { id: 'end', kind: 'end', text: 'Hope next week is better.', effects: [{ met: true }, { stage: 1 }], end: true },
        ],
      },
      b: {
        text: 'Honestly? Not well. My wife does not know yet. Every time I lose, I bet again to win it back. It is a trap, I know it is a trap.',
        choices: [
          { id: 'pray', kind: 'pray', text: 'Can I pray with you? Just a short one.', effects: [{ trust: 4 }, { counter: 'prayersWithOthers' }, { event: 'pray_with', npc: 'emeka' }], next: 'd' },
          { id: 'later', kind: 'end', text: 'Let me think about how I can help. I will come back.', effects: [{ trust: 2 }], end: true },
        ],
      },
      c: { text: 'Thank you, pastor. Very helpful. (He turns back to his keke.)', choices: [{ id: 'ok', kind: 'end', text: '…', end: true }] },
      d: { text: 'Amen. Thank you. Nobody has prayed with me since my mother died. Come back and see me.', choices: [{ id: 'ok', kind: 'end', text: 'I will.', end: true }] },
    },
  },
  emeka_help: {
    npc: 'emeka',
    start: 'a',
    scripture: ['Proverbs 13:11', 'Proverbs 22:7'],
    nodes: {
      a: {
        text: 'The lender came to the park today. Shouting. Everybody heard. What do I do?',
        choices: [
          { id: 'budget', kind: 'help', text: 'Let us sit down and make a real budget — every naira in and out. Then a plan to pay him back.', effects: [{ time: 60 }, { trust: 9 }, { setFlag: 'emeka_budget' }, { skill: 'communication', amount: 1 }, { counter: 'serviceActs' }, { event: 'service', kind: 'budget_help' }, { stage: 2 }], next: 'b' },
          { id: 'money', kind: 'help', text: 'Here is 10,000 towards the debt.', requires: { coins: { gte: 10000 } }, effects: [{ coins: -10000, reason: 'Helped Emeka with his debt', donation: true }, { trust: 6 }, { setFlag: 'emeka_money' }, { counter: 'serviceActs' }, { event: 'donate', cause: 'emeka', amount: 10000 }, { schedule: { eventId: 'emeka_money_followup', inDays: 6 } }, { stage: 2 }], next: 'c' },
          { id: 'pastor', kind: 'invite', text: 'Pastor Tunde has helped people with debt before. Will you talk to him with me?', effects: [{ trust: 4 }, { setFlag: 'emeka_pastor' }, { stage: 2 }], next: 'd' },
        ],
      },
      b: { text: 'Na wa. I spend more on airtime and bets than on food. Seeing it written down… it is shameful. But it is clear.', choices: [{ id: 'ok', kind: 'listen', text: 'It is the first step. You are not alone in this.', end: true }] },
      c: { text: 'You would do that for me? I… thank you. I will pay you back. I swear.', choices: [{ id: 'ok', kind: 'listen', text: 'Pay off the lender first. We can talk about the rest later.', end: true }] },
      d: { text: 'A pastor? He will just shout at me. …Okay. Okay, if you come with me.', choices: [{ id: 'ok', kind: 'end', text: 'I will be there.', end: true }] },
    },
  },
  emeka_accountability: {
    npc: 'emeka',
    start: 'a',
    scripture: ['Galatians 6:2'],
    nodes: {
      a: {
        text: 'Two days without placing a bet. The app is still on my phone, sha. My hand keeps going there.',
        choices: [
          { id: 'acc', kind: 'help', text: 'What if I check in on you every week? And you delete the app now, while I am standing here.', effects: [{ trust: 8 }, { setFlag: 'emeka_accountability' }, { counter: 'serviceActs' }, { stage: 3 }], next: 'b' },
          { id: 'enc', kind: 'listen', text: 'Two days is real progress. Keep going.', effects: [{ trust: 3 }, { stage: 3 }], end: true },
        ],
      },
      b: { text: '(He hesitates, then deletes it.) There. Gone. Do not let me reinstall it. Check on me.', choices: [{ id: 'ok', kind: 'end', text: 'Every week. Promise.', end: true }] },
    },
  },
  emeka_checkin: {
    npc: 'emeka',
    start: 'a',
    nodes: {
      a: {
        text: 'Still clean. Still paying the lender small-small. My wife knows now. She was angry, then she cried, then she made me pepper soup. Women!',
        choices: [{ id: 'ok', kind: 'listen', text: 'That sounds like love to me. Proud of you, Emeka.', effects: [{ trust: 3 }], end: true }],
      },
    },
  },
  emeka_why: {
    npc: 'emeka',
    start: 'a',
    nodes: {
      a: {
        text: 'Can I ask you something? Why do you care so much? I am just a keke man you met at the park.',
        choices: [
          { id: 'gospel', kind: 'explain', text: 'Because someone cared for me first. I believe Jesus gave himself for people while they were still a mess — me included. It is a gift, not a wage.', scripture: ['Romans 5:8', 'Ephesians 2:8-9'], effects: [{ counter: 'conversations' }, { setFlag: 'emeka_answered_why' }], next: 'branch' },
          { id: 'simple', kind: 'smalltalk', text: 'Because you are my friend.', effects: [{ trust: 3 }], end: true },
        ],
      },
      branch: {
        text: '…',
        auto: [
          { when: { all: [{ trust: { npc: 'emeka', gte: 25 } }, { any: [{ flag: 'emeka_accountability' }, { flag: 'emeka_budget' }] }] }, next: 'yes' },
          { next: 'notyet' },
        ],
      },
      yes: {
        text: 'A gift, not a wage. I have been trying to earn everything my whole life — money, respect, God. I am tired. I want this gift. Will you pray with me?',
        choices: [{ id: 'pray', kind: 'pray', text: 'Yes. Right here, right now.', effects: [{ storyline: { id: 'emeka', outcome: 'conversion' } }, { stage: 5 }, { trust: 10 }], next: 'after' }],
      },
      after: {
        text: 'I feel lighter. Still owe the lender five thousand, but lighter. What do I do now?',
        choices: [{ id: 'fellow', kind: 'invite', text: 'Come and meet people who will walk with you. There is a fellowship at Grace Chapel — and Pastor Tunde has a men’s group.', scripture: ['Acts 2:42', 'Hebrews 10:24-25'], end: true }],
      },
      notyet: {
        text: 'Hmm. Let me sort my life out first. Then maybe God will want me.',
        choices: [
          { id: 'grace', kind: 'explain', text: 'You do not have to clean up first. That is the whole point of a gift. But take your time — I am not going anywhere.', effects: [{ trust: 5 }, { counter: 'respectfulWitness' }, { setFlag: 'emeka_s3' }], end: true },
        ],
      },
    },
  },
  emeka_fellowship: {
    npc: 'emeka',
    start: 'a',
    nodes: {
      a: {
        text: 'I went to the men’s group! They gave me tea and nobody judged me. One man said he lost his house to betting. I am not the only one.',
        choices: [
          { id: 'serve', kind: 'invite', text: 'Want to serve with me at the food bank on Saturday?', effects: [{ storyline: { id: 'emeka', outcome: 'conversion', discipled: true } }, { counter: 'discipleship' }, { stage: 6 }, { event: 'discipleship', npc: 'emeka' }, { trust: 5 }], next: 'b' },
          END,
        ],
      },
      b: { text: 'Me? Serving? …Yes. Why not. Somebody fed me when I was hungry. Let me feed somebody.', choices: [{ id: 'ok', kind: 'end', text: 'See you there.', end: true }] },
    },
  },
  emeka_smalltalk: {
    npc: 'emeka',
    start: 'a',
    nodes: { a: { text: 'My friend! You need a ride? For you, half price. Okay, three-quarter price.', choices: [{ id: 'ha', kind: 'smalltalk', text: 'Ha! Next time.', effects: [{ trust: 1 }], end: true }] } },
  },
  emeka_after: {
    npc: 'emeka',
    start: 'a',
    nodes: { a: { text: 'Lender paid off! Every kobo! And I am saving at the cooperative now. Can you believe it?', choices: [{ id: 'ha', kind: 'smalltalk', text: 'I believe it. Well done!', effects: [{ wellbeing: 3 }], end: true }] } },
  },

  // ───────────────────────────── AISHA — Muslim colleague, respectful friendship ─────────────────────────────
  aisha_intro: {
    npc: 'aisha',
    start: 'a',
    nodes: {
      a: {
        text: 'You must be new — you have the "where is the printer" face. It is behind the cooler, and it jams if you look at it wrongly. I am Aisha, dispatch.',
        choices: [
          { id: 'thanks', kind: 'smalltalk', text: 'Thank you! I would have been lost all week.', effects: [{ trust: 5 }, { met: true }, { stage: 1 }], next: 'b' },
          { id: 'ask', kind: 'ask', text: 'How long have you worked here?', effects: [{ trust: 4 }, { met: true }, { stage: 1 }], next: 'c' },
        ],
      },
      b: { text: 'Do not thank me yet. Wait until month-end reports.', choices: [END] },
      c: { text: 'Six years. Long enough to know where the good tea is hidden. I will show you sometime.', choices: [END] },
    },
  },
  aisha_lunch: {
    npc: 'aisha',
    start: 'a',
    nodes: {
      a: {
        text: 'Lunch? I brought too much tuwo, my mother still cooks for an army.',
        choices: [
          { id: 'yes', kind: 'smalltalk', text: 'I would love some. Tell me about your family.', effects: [{ trust: 6 }, { time: 45 }, { energy: 12 }], next: 'b' },
          { id: 'busy', kind: 'end', text: 'Sorry, too busy today.', end: true },
        ],
      },
      b: {
        text: 'Three brothers, one very loud sister, and my father — he is not well at the moment. His heart. We are taking it one day at a time.',
        choices: [
          { id: 'listen', kind: 'listen', text: 'I am sorry to hear that. How are you coping?', effects: [{ trust: 6 }, { stage: 2 }], next: 'c' },
          { id: 'pray', kind: 'pray', text: 'I will be praying for him — if that is okay with you.', effects: [{ trust: 4 }, { stage: 2 }, { setFlag: 'aisha_prayer_offer' }], next: 'd' },
        ],
      },
      c: { text: 'Tired. But it helps to say it to someone at work who is not asking about the dispatch numbers.', choices: [END] },
      d: { text: 'That is kind. I am praying for him too. Thank you.', choices: [END] },
    },
  },
  aisha_father: {
    npc: 'aisha',
    start: 'a',
    scripture: ['Romans 12:15'],
    nodes: {
      a: {
        text: 'My father has to go to the teaching hospital in the city on Thursday. I need to go with him but my shift… Folake will not be happy.',
        choices: [
          { id: 'cover', kind: 'help', text: 'I will cover your shift. Go and be with your father.', requires: { job: true }, effects: [{ time: 240 }, { energy: -15 }, { trust: 12 }, { counter: 'serviceActs' }, { event: 'service', kind: 'covered_shift' }, { setFlag: 'aisha_covered' }, { stage: 3 }], next: 'b' },
          { id: 'listen', kind: 'listen', text: 'That sounds stressful. Is there anything I can do?', effects: [{ trust: 4 }, { stage: 3 }], next: 'c' },
        ],
      },
      b: { text: 'You would do that? …Thank you. Really. I will not forget it.', choices: [END] },
      c: { text: 'Just knowing someone asked helps. I will figure it out.', choices: [END] },
    },
  },
  aisha_question: {
    npc: 'aisha',
    start: 'a',
    scripture: ['1 Peter 3:15-16', 'Colossians 4:6'],
    nodes: {
      a: {
        text: 'My father is home and doing better, alhamdulillah. Can I ask you something I have always wondered? Why do Christians call Jesus the Son of God? For us, he is a great prophet. Calling him God’s son sounds strange to me.',
        choices: [
          { id: 'explain', kind: 'explain', text: 'Good question. Christians do not mean God had a son the way people do. We believe Jesus is God’s eternal Word who became human. I can show you where that comes from in John’s Gospel — and I would like to hear how you see him too.', scripture: ['John 1:1-14'], effects: [{ trust: 6 }, { counter: 'conversations' }, { counter: 'respectfulWitness' }], next: 'b' },
          { id: 'pushy', kind: 'pushy', text: 'Because it is the truth, and you need to accept it.', effects: [{ trust: -10 }, { counter: 'pushyWitness' }], next: 'c' },
        ],
      },
      b: {
        text: 'We see it differently, you and I. But you did not make me feel stupid for asking, and you listened to my side. That is rare. Thank you for explaining.',
        choices: [
          { id: 'invite', kind: 'invite', text: 'Our church has a carol night in December. You and your family would be welcome as guests — no pressure at all.', effects: [{ setFlag: 'aisha_invited' }, { stage: 4 }, { storyline: { id: 'aisha', outcome: 'friendship' } }], next: 'd' },
          { id: 'friend', kind: 'respect', text: 'Thank you for asking. I enjoy our talks.', effects: [{ stage: 4 }, { storyline: { id: 'aisha', outcome: 'friendship' } }, { trust: 4 }], next: 'e' },
        ],
      },
      c: {
        text: 'I asked you a question as a friend. I think I would rather we talk about work.',
        choices: [{ id: 'sorry', kind: 'respect', text: 'You are right. I am sorry — that was not respectful.', effects: [{ trust: 4 }], end: true }],
      },
      d: { text: 'Maybe — I will ask my sister; she loves singing. And next Sallah, you are coming to eat at our house. That is not optional!', choices: [{ id: 'ok', kind: 'end', text: 'I would be honoured.', end: true }] },
      e: { text: 'Me too. Now come — these reports will not file themselves.', choices: [END] },
    },
  },
  aisha_smalltalk: {
    npc: 'aisha',
    start: 'a',
    nodes: { a: { text: 'The printer jammed again. I am starting to think it has a personal problem with me.', choices: [{ id: 'ha', kind: 'smalltalk', text: 'It has a problem with everyone!', effects: [{ trust: 1 }], end: true }] } },
  },
  aisha_after: {
    npc: 'aisha',
    start: 'a',
    nodes: { a: { text: 'My father says to greet you. He wants to meet the colleague who covered my shift.', choices: [{ id: 'ha', kind: 'smalltalk', text: 'Greet him for me too!', effects: [{ trust: 1 }, { wellbeing: 2 }], end: true }] } },
  },

  // ───────────────────────────── NNEKA — neighbour in need ─────────────────────────────
  nneka_intro: {
    npc: 'nneka',
    start: 'a',
    nodes: {
      a: {
        text: 'Good morning, neighbour. Sorry, the children have been noisy. School resumes next week and I am still short on fees — the salon has been quiet.',
        choices: [
          { id: 'listen', kind: 'listen', text: 'No need to apologise. How short are you?', effects: [{ trust: 6 }, { met: true }, { stage: 1 }], next: 'b' },
          { id: 'end', kind: 'end', text: 'Good morning! Hope business picks up.', effects: [{ met: true }, { stage: 1 }], end: true },
        ],
      },
      b: { text: 'I will manage. I always do. But if you hear of anyone wanting braids, send them to me!', choices: [{ id: 'ok', kind: 'end', text: 'I will tell everyone.', end: true }] },
    },
  },
  nneka_need: {
    npc: 'nneka',
    start: 'a',
    scripture: ['Matthew 25:35-40', 'James 2:15-16'],
    nodes: {
      a: {
        text: 'Ah, neighbour. The children are asking what is for dinner and I do not have a good answer today.',
        choices: [
          { id: 'food', kind: 'help', text: 'Here — take this bag of foodstuff.', requires: { hasItem: 'foodstuff_bag' }, effects: [{ takeItem: 'foodstuff_bag' }, { trust: 8 }, { setFlag: 'nneka_helped' }, { counter: 'serviceActs' }, { event: 'service', kind: 'feed_neighbour' }, { event: 'give_item', item: 'foodstuff_bag', npc: 'nneka' }], next: 'b' },
          { id: 'fruit', kind: 'help', text: 'I have a fruit basket for the children.', requires: { hasItem: 'fruit_basket' }, effects: [{ takeItem: 'fruit_basket' }, { trust: 5 }, { setFlag: 'nneka_helped' }, { counter: 'serviceActs' }, { event: 'service', kind: 'feed_neighbour' }, { event: 'give_item', item: 'fruit_basket', npc: 'nneka' }], next: 'b' },
          { id: 'babysit', kind: 'help', text: 'Go and see your customers — I will watch the children for two hours.', requires: { stat: { name: 'energy', gte: 15 } }, effects: [{ time: 120 }, { energy: -12 }, { trust: 7 }, { counter: 'serviceActs' }, { event: 'service', kind: 'babysit' }, { setFlag: 'nneka_helped' }], next: 'c' },
          { id: 'pray', kind: 'pray', text: 'Can I pray with you?', effects: [{ trust: 3 }, { counter: 'prayersWithOthers' }, { event: 'pray_with', npc: 'nneka' }], next: 'd' },
          END,
        ],
      },
      b: { text: 'God bless you. I will not cry in front of you. …Okay, maybe a little.', choices: [END] },
      c: { text: 'Three customers! Three! Thank you, neighbour.', choices: [END] },
      d: { text: 'Amen. I needed that more than you know.', choices: [END] },
    },
  },
  nneka_thanks: {
    npc: 'nneka',
    start: 'a',
    nodes: {
      a: {
        text: 'The children made you something. Ada drew you with a very big head — she says it is because you have a big heart.',
        choices: [{ id: 'ok', kind: 'smalltalk', text: 'I love it. Thank you!', effects: [{ giveItem: 'thank_you_card' }, { setFlag: 'nneka_thanked' }, { wellbeing: 6 }], end: true }],
      },
    },
  },

  // ───────────────────────────── PASTOR TUNDE ─────────────────────────────
  pastor_main: {
    npc: 'pastor_tunde',
    start: 'a',
    nodes: {
      a: {
        text: 'Welcome, welcome! Grace Chapel is a simple place — prayer, the Word, the food bank, and too many meetings. How can I help?',
        choices: [
          { id: 'missions', kind: 'ask', text: 'Is there anything I can help with here?', effects: [{ met: true }, { startMission: 'quiet_place' }, { startMission: 'i_was_hungry' }, { startMission: 'bible_study_circle' }], next: 'm' },
          { id: 'debt', kind: 'ask', text: 'My friend Emeka is struggling with betting debts.', requires: { flag: 'emeka_pastor' }, effects: [{ trust: 3, npc: 'emeka' }, { setFlag: 'pastor_met_emeka' }], next: 'debt' },
          { id: 'doubt', kind: 'ask', text: 'Pastor, Christians disagree about so many things — the end times, worship, everything. How do I know what is right?', effects: [{ met: true }], next: 'doubt' },
          { id: 'theo', kind: 'ask', text: 'How does someone train for ministry?', effects: [{ met: true }], next: 'theo' },
          END,
        ],
      },
      m: {
        text: 'Plenty! Start with prayer — a quiet place, just you and God. Then come and serve at the food bank. And Brother Sam’s Bible study circle is in the evenings. I have added them to your missions journal.',
        choices: [END],
      },
      debt: { text: 'Bring him on Tuesday evening. We have a men’s group, and some of them have walked that road. No shouting, I promise.', choices: [END] },
      doubt: {
        text: 'Honest question. Christians do agree on a lot: Jesus, his death and resurrection, grace. On other things — like the order of end-time events — faithful people read the Scriptures differently. Hold the centre firmly and the edges humbly. Read it yourself, in context, with others.',
        choices: [END],
      },
      theo: { text: 'Grace Bible Institute runs a diploma through the Learning Centre registrar. Three hundred hours, more or less. Pray about it — ministry is a calling, not just a job.', choices: [END] },
    },
  },

  // ───────────────────────────── BROTHER SAM ─────────────────────────────
  sam_main: {
    npc: 'brother_sam',
    start: 'a',
    nodes: {
      a: {
        text: 'Hey! Bible study circle is at the table by the door — evenings from four. We read slowly, ask questions, eat chin-chin. Mostly the chin-chin.',
        choices: [
          { id: 'how', kind: 'ask', text: 'How do you study a passage properly?', scripture: ['2 Timothy 2:15'], effects: [{ met: true }, { skill: 'communication', amount: 1 }], next: 'how' },
          { id: 'chidi', kind: 'ask', text: 'My friend Chidi has a hundred questions.', requires: { flag: 'chidi_disciple_invited' }, next: 'chidi' },
          END,
        ],
      },
      how: {
        text: 'Three questions: what did it mean to the first readers? What does it show us about God? What does it ask of me? And never pull a verse out of its chapter like a cassava from the ground — read around it.',
        choices: [END],
      },
      chidi: { text: 'Bring him! Questions are my favourite. I have a few hundred myself.', choices: [END] },
    },
  },

  // ───────────────────────────── MAMA NGOZI ─────────────────────────────
  ngozi_main: {
    npc: 'mama_ngozi',
    start: 'a',
    nodes: {
      a: {
        text: 'My pikin! Come in, come in. You want to buy, you want to work, or you want advice? Advice is free. The rest, you pay.',
        choices: [
          { id: 'advice', kind: 'ask', text: 'What is your secret for doing well at Oja for so long?', scripture: ['Proverbs 11:1'], effects: [{ met: true }, { skill: 'trade', amount: 1 }], next: 'adv' },
          { id: 'scales', kind: 'ask', text: 'Can I help you with anything around the shop?', requires: { not: { mission: { id: 'honest_scales', status: ['active', 'completed'] } } }, effects: [{ met: true }, { startMission: 'honest_scales' }], next: 'scales' },
          END,
        ],
      },
      adv: {
        text: 'Honest measure. Customers come back to the woman whose scale does not lie. I have watched people get rich fast with crooked scales, and I have watched them close fast too.',
        choices: [END],
      },
      scales: {
        text: 'You can help. Work a shift with me as a shop assistant this week. I travel to the wholesaler on Wednesdays — you will hold the shop.',
        choices: [END],
      },
    },
  },

  // ───────────────────────────── FOLAKE ─────────────────────────────
  folake_main: {
    npc: 'folake',
    start: 'a',
    nodes: {
      a: {
        text: 'Yes? Make it quick — head office is breathing down my neck about quarter-end numbers.',
        choices: [
          { id: 'promo', kind: 'ask', text: 'How can I grow in this company?', next: 'promo' },
          END,
        ],
      },
      promo: {
        text: 'Show up. Do the work. Twenty solid shifts and good performance, and I will consider you for promotion. And do not bring me problems without solutions.',
        choices: [END],
      },
    },
  },

  // ───────────────────────────── IBRAHIM ─────────────────────────────
  ibrahim_main: {
    npc: 'ibrahim',
    start: 'a',
    nodes: {
      a: {
        text: 'Sannu! Welcome back to Amaka Close. All is quiet tonight. If anything troubles you, come to me first.',
        choices: [
          { id: 'thanks', kind: 'smalltalk', text: 'Thank you, Mallam. How is your family?', effects: [{ trust: 3 }, { met: true }], next: 'b' },
          { id: 'threat', kind: 'ask', text: 'Mallam, someone left a threatening note at our fellowship.', requires: { flag: 'threat_note_received' }, next: 'threat' },
          END,
        ],
      },
      b: { text: 'Fine, fine. My son passed his exams! He wants to be an engineer. Like you young people with your big dreams.', choices: [END] },
      threat: {
        text: 'This is serious. Report it to the police division and tell your pastor. I will watch the close more closely at night, and I will talk to the young men around here. Nobody will trouble a neighbour on my watch.',
        choices: [{ id: 'thank', kind: 'smalltalk', text: 'Thank you, Mallam. That means a lot.', effects: [{ setFlag: 'ibrahim_protects' }, { trust: 5 }], end: true }],
      },
    },
  },

  // ───────────────────────────── DR AMINA ─────────────────────────────
  amina_main: {
    npc: 'dr_amina',
    start: 'a',
    nodes: {
      a: {
        text: 'Next! Oh — not a patient? Good, I have forty of those. What do you need?',
        choices: [
          { id: 'career', kind: 'ask', text: 'How does someone become a nurse or doctor here?', effects: [{ met: true }], next: 'career' },
          { id: 'rest', kind: 'ask', text: 'Any health advice?', effects: [{ met: true }], next: 'rest' },
          END,
        ],
      },
      career: { text: 'Nursing diploma or MBBS through the registrar at the Learning Centre. Long hours, short sleep. If you want it, it is worth it.', choices: [END] },
      rest: { text: 'Sleep. Water. Real food, not just suya. And come for a check-up when you feel run down — do not wait until you collapse.', choices: [END] },
    },
  },

  // ───────────────────────────── TOBI VIBES — fictional celebrity ─────────────────────────────
  tobi_main: {
    npc: 'tobi',
    start: 'a',
    scripture: ['Matthew 11:28-30'],
    nodes: {
      a: {
        text: '(After the show, Tobi Vibes sits alone backstage, scrolling his phone.) Hey. If you want a selfie, my manager is outside.',
        choices: [
          { id: 'selfie', kind: 'smalltalk', text: 'Actually — yes, a quick selfie!', effects: [{ wellbeing: 4 }, { setFlag: 'tobi_selfie' }], next: 'selfie' },
          { id: 'ask', kind: 'ask', text: 'No selfie. You looked tired after the show. Are you okay?', effects: [{ met: true }, { trust: 8 }], next: 'b' },
        ],
      },
      selfie: { text: '(Click.) There you go. Enjoy the rest of your night.', choices: [END] },
      b: {
        text: '…Nobody asks that. Truth? Twelve cities in three weeks. Everyone wants something. My grandmother used to sing hymns in Nkwo while she cooked. I miss that quiet.',
        choices: [
          { id: 'listen', kind: 'listen', text: 'That sounds lonely. What did she sing?', effects: [{ trust: 5 }, { setFlag: 'tobi_talked' }], next: 'c' },
          { id: 'scripture', kind: 'scripture', text: 'There is a place in Matthew where Jesus invites tired people to come to him for rest. I thought of it watching you.', scripture: ['Matthew 11:28-30'], effects: [{ trust: 4 }, { setFlag: 'tobi_talked' }, { counter: 'conversations' }], next: 'd' },
          { id: 'pushy', kind: 'pushy', text: 'Your music is worldly. You should switch to gospel.', effects: [{ trust: -6 }, { counter: 'pushyWitness' }, { setFlag: 'tobi_talked' }], next: 'e' },
        ],
      },
      c: { text: 'Old ones. She would hum when she forgot the words. …Thanks for asking. Really.', choices: [{ id: 'pray', kind: 'pray', text: 'Can I pray for you before you go?', effects: [{ counter: 'prayersWithOthers' }, { event: 'pray_with', npc: 'tobi' }], next: 'f' }, END] },
      d: { text: 'Rest. Hmm. I will remember that. My grandmother would have liked you.', choices: [END] },
      e: { text: 'Right. Okay. Security will show you out.', choices: [END] },
      f: { text: '(He nods and closes his eyes.) …Amen. Do not post this on Instagram, abeg.', choices: [{ id: 'ok', kind: 'respect', text: 'I would never.', end: true }] },
    },
  },
  tobi_after: {
    npc: 'tobi',
    start: 'a',
    nodes: { a: { text: 'The one who asked if I was okay! Good to see you again.', choices: [END] } },
  },

  // ───────────────────────────── NKWO ─────────────────────────────
  obi_main: {
    npc: 'uncle_obi',
    start: 'a',
    nodes: {
      a: {
        text: 'Nwa m! You came home! Look at you — city food is agreeing with you. Have you come to help with the borehole? The whole village is contributing.',
        choices: [
          { id: 'borehole', kind: 'ask', text: 'Tell me about the borehole project.', effects: [{ met: true }, { startMission: 'generous_hands' }], next: 'b' },
          { id: 'family', kind: 'smalltalk', text: 'How is everyone at home?', effects: [{ met: true }, { trust: 3 }], next: 'c' },
          END,
        ],
      },
      b: {
        text: 'Women walk two kilometres for water. Children miss school to fetch it. We need 400,000 for drilling and a pump. Some give money, some give labour. Everyone gives something. Go to the site and see.',
        choices: [END],
      },
      c: { text: 'Everyone is well. Your cousin Obinna is preparing for exams. School fees in this economy — eh! We will manage.', choices: [END] },
    },
  },
  adaeze_main: {
    npc: 'nne_adaeze',
    start: 'a',
    nodes: {
      a: {
        text: 'Come and sit. City people are always rushing. The yam does not grow faster because you shout at it.',
        choices: [
          { id: 'farm', kind: 'ask', text: 'Can you teach me about farming?', effects: [{ met: true }, { skill: 'farming', amount: 2 }, { time: 60 }], next: 'farm' },
          { id: 'pray', kind: 'ask', text: 'Nne, how do you pray?', effects: [{ met: true }], next: 'pray' },
          END,
        ],
      },
      farm: { text: 'Prepare the ground, plant at the right time, weed, wait. Most of farming is waiting and trusting. There is a plot for sale behind the church if you ever want land.', choices: [END] },
      pray: { text: 'Every morning before the farm, I thank him for the day, I name my children and grandchildren one by one, and I ask for what we need. Then I go and work. Prayer is not instead of work, nwa m.', choices: [END] },
    },
  },

  // ───────────────────────────── PHILIPPI (historical, fictional NPCs) ─────────────────────────────
  aulus_main: {
    npc: 'aulus',
    start: 'a',
    nodes: {
      a: {
        text: '(Historical scenario — Aulus is a fictional character.) Halt, stranger. This is Philippi, a Roman colony — Roman law, Roman roads. State your business.',
        choices: [
          { id: 'colony', kind: 'ask', text: 'What does it mean that Philippi is a colony?', scripture: ['Acts 16:12'], effects: [{ setFlag: 'ph_learned_colony' }, { event: 'history_fact', fact: 'colony' }], next: 'b' },
          { id: 'river', kind: 'ask', text: 'Is there a place outside the city where people pray?', next: 'c' },
          END,
        ],
      },
      b: {
        text: 'Veterans like me were settled here after the wars. We are citizens, the town is run like a little Rome, and the great road east runs right through. (Game note: Philippi was refounded as a Roman colony in the first century BC; Acts 16:12 also calls it a colony.)',
        choices: [END],
      },
      c: { text: 'Some of the Jews and God-fearers gather by the river on their Sabbath, outside the gate. Through there, then down to the water.', choices: [END] },
    },
  },
  berenike_main: {
    npc: 'berenike',
    start: 'a',
    nodes: {
      a: {
        text: '(Historical scenario — Berenike is a fictional character.) Oh! Can you help? These bolts of purple cloth must reach the market stall before the heat. They are worth more than my year’s wages.',
        choices: [
          { id: 'help', kind: 'help', text: 'Of course. Give me a load.', effects: [{ setFlag: 'ph_cloth_delivered' }, { counter: 'serviceActs' }, { event: 'service', kind: 'philippi_cloth' }, { giveItem: 'purple_swatch' }], next: 'b' },
          END,
        ],
      },
      b: { text: 'Thank you, traveller! Here — keep this scrap. The merchants of purple come from as far as Thyatira, you know. The dye is costly work.', choices: [END] },
    },
  },
  berenike_done: {
    npc: 'berenike',
    start: 'a',
    nodes: { a: { text: 'The cloth arrived safely. May the day be kind to you, traveller.', choices: [END] } },
  },

  ambient: {
    npc: null,
    start: 'a',
    nodes: { a: { text: '…', ambientLine: true, choices: [{ id: 'bye', kind: 'end', text: 'Have a good day!', end: true }] } },
  },
};
