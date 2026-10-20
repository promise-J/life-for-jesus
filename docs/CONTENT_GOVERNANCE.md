# Scripture, theology and content governance

## Scripture

- **Translation:** World English Bible (WEB), public domain — https://ebible.org/web/. The full text (31,103 verses) lives in `server/data/web-bible.json`, built by `scripts/build-bible.mjs`. The translation is configurable (`BIBLE_DATA_FILE`); any replacement must be licensed for your distribution.
- **No invented verses.** Game content stores only *references*. Verse text is always fetched from the Bible data and displayed in a distinct gold-edged “Scripture · WEB” card. Dialogue never contains quoted verse text; a character may *point to* a passage (“there is a psalm about…”), and the real text appears in a card.
- **Five kinds of text are kept visually distinct:** Scripture (gold-edged serif card), historical notes (“Historical notes — what is documented and what is invented”), game dialogue (labelled “Game dialogue — fictional characters”), explanatory commentary (labelled “game commentary” / “Why it’s here”), and reward mechanics (crowns/badges labelled as gameplay recognitions).
- **Every Scripture link records why it is there.** Missions and scenarios carry `{ ref, why }`; curated entries (`shared/content/scripture.js`) carry topic tags, a context note, where they are used and whether they are quoted or referenced.
- **Automated check:** `shared/test/content.test.js` verifies that every reference used anywhere in the game parses and exists in the Bible data.
- No fictional dialogue is attributed to Jesus, the apostles, Lydia or any biblical figure. In Philippi, the events of Acts 16 are shown only through the text of Acts; the NPCs (Aulus, Berenike, Gaius) are fictional and labelled so.

## Theological design choices (documented, not asserted)

- **Salvation is never computed.** No coins, crowns, prayers, donations or missions feed into any verdict. The ending shows Ephesians 2:8–10 alongside the accountability passages, and the report states it is a record of a simulated life, not a judgment.
- **The ending is not a prediction.** The trumpet is a game mechanic scheduled by a hidden, controlled random distribution. The game notes that Christians understand the order of end-time events differently and does not present one chronology as settled. The ending sequence uses 1 Corinthians 15:51–52, 1 Thessalonians 4:16–17, 2 Corinthians 5:10, Romans 14:10–12, Matthew 25:34–40 (excerpt of 25:31–46) and Ephesians 2:8–10 as reflection.
- **Prayer is not a transaction.** Praying costs a little time and may give a moment of calm (at most once a game day). It never gives money, success, protection or a particular outcome. Praying before a decision is remembered in the story; it doesn’t choose for you. Prayer crowns recognise participation only.
- **Evangelism respects people.** Pushy choices lower trust and are flagged in the moment. Respecting a request for space is rewarded. Storylines can end in a fictional decision to follow Jesus *or* in an honest friendship without agreement — both complete the mission. Aisha, a Muslim colleague, has a friendship storyline with no conversion target. No storyline converts in a single conversation.
- **Conversions are fictional.** The “Crown of Rejoicing” fires when a fictional storyline reaches that outcome; the game repeatedly states that software cannot know anyone’s heart.
- **Giving can’t buy crowns.** Donations are recorded in the life story only. The borehole project counts a day of labour the same as money, and cites Mark 12:41–44.
- **Wealth isn’t a moral score.** Treating yourself, investing, saving and giving are all legitimate windfall choices with different consequences. Honest choices are not always the profitable ones (the honest report costs a bonus; fixing the scale costs unpaid hours).
- **Persecution is serious, not glorified.** The threat scenario offers prudent options (report it, pause public outreach, meet safely, go in pairs) without implying that seeking safety is a lack of faith. Mallam Ibrahim, a Muslim security guard, protects the fellowship — the game avoids portraying any religion or group as uniformly hostile. Not every hardship is framed as persecution.
- **Denominational humility.** Pastor Tunde’s dialogue explicitly distinguishes the shared centre of Christian faith from matters on which faithful Christians disagree.

## Fiction vs. fact

- Udoka, Nkwo and all present-day characters (including the celebrity Tobi Vibes) are fictional. No real public figure is depicted or quoted.
- Philippi facts presented as history: it was a Roman colony (also stated in Acts 16:12); the Via Egnatia passed through it; purple cloth was costly; Acts 16:13–15 describes a riverside place of prayer and Lydia, a seller of purple from Thyatira. Layout, buildings and NPCs are the game’s reconstruction and are labelled as such.
- Planned eras (Antioch, Wittenberg) and other countries appear only as clearly locked, “planned — not yet built” entries.

## Reward numbers

All amounts (XP, coins, salaries, prices) are game-balancing choices in `shared/content/rewards.js` and `careers.js`/`items.js`. None is derived from Scripture.
