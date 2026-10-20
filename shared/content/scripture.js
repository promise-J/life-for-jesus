// Curated Scripture entries for topic browsing and game linkage.
// Only references and the game's own context notes live here. The verse TEXT always comes from
// the public-domain World English Bible data on the server — nothing here is quoted Scripture.
// `use`: 'quoted' (text shown in game) or 'referenced' (pointed to only).

export const TRANSLATION = {
  id: 'WEB',
  name: 'World English Bible',
  licence: 'Public Domain',
  source: 'https://ebible.org/web/',
  note: 'The WEB is in the public domain. Translation is configurable via BIBLE_DATA_FILE on the server.',
};

export const TOPICS = [
  { id: 'prayer', name: 'Prayer' },
  { id: 'generosity', name: 'Generosity' },
  { id: 'forgiveness', name: 'Forgiveness' },
  { id: 'evangelism', name: 'Sharing faith' },
  { id: 'integrity', name: 'Integrity' },
  { id: 'perseverance', name: 'Perseverance' },
  { id: 'stewardship', name: 'Stewardship' },
  { id: 'service', name: 'Service' },
  { id: 'grace', name: 'Grace' },
  { id: 'suffering', name: 'Suffering & comfort' },
  { id: 'work', name: 'Work' },
  { id: 'family', name: 'Family' },
  { id: 'fellowship', name: 'Fellowship' },
  { id: 'judgment', name: 'Accountability & judgment' },
  { id: 'return', name: 'The return of Christ' },
];

export const SCRIPTURE_ENTRIES = [
  { ref: 'Matthew 6:6', topics: ['prayer'], use: 'quoted', usedBy: ['quiet_place'], context: 'Part of the Sermon on the Mount, where Jesus contrasts private prayer with religious performance.' },
  { ref: 'Matthew 6:9-13', topics: ['prayer'], use: 'quoted', usedBy: ['prayer:scripture_guided'], context: 'The prayer Jesus taught his disciples, within the Sermon on the Mount.' },
  { ref: 'Philippians 4:6-7', topics: ['prayer'], use: 'quoted', usedBy: ['prayer:personal'], context: 'Paul writes from imprisonment, encouraging the church at Philippi to bring everything to God in prayer.' },
  { ref: 'James 1:5', topics: ['prayer'], use: 'quoted', usedBy: ['prayer:decision'], context: 'James writes to believers facing trials; asking God for wisdom is part of enduring well.' },
  { ref: 'Psalms 46:10', topics: ['prayer'], use: 'quoted', usedBy: ['prayer:quiet'], context: 'A psalm of trust in God amid upheaval among the nations.' },
  { ref: 'Psalms 23', topics: ['prayer', 'suffering'], use: 'quoted', usedBy: ['prayer:scripture_guided'], context: 'David’s psalm of the LORD as shepherd and host, including the darkest valley.' },
  { ref: '1 Thessalonians 5:16-18', topics: ['prayer'], use: 'quoted', usedBy: ['prayer:thanksgiving'], context: 'Closing instructions to a young, pressured church.' },
  { ref: '2 Corinthians 9:6-8', topics: ['generosity'], use: 'quoted', usedBy: ['generous_hands'], context: 'Paul encourages the Corinthians about their collection for poor believers in Jerusalem — giving willingly, not under compulsion.' },
  { ref: 'Mark 12:41-44', topics: ['generosity'], use: 'quoted', usedBy: ['generous_hands'], context: 'Jesus watches people give at the temple treasury and honours a poor widow’s small gift.' },
  { ref: 'Acts 20:35', topics: ['generosity', 'work'], use: 'quoted', usedBy: [], context: 'Paul’s farewell to the Ephesian elders, recalling working to help the weak.' },
  { ref: 'Matthew 6:14-15', topics: ['forgiveness'], use: 'quoted', usedBy: [], context: 'Jesus’ teaching immediately following the Lord’s Prayer.' },
  { ref: 'Ephesians 4:32', topics: ['forgiveness'], use: 'quoted', usedBy: [], context: 'Paul describes the new way of life of people forgiven in Christ.' },
  { ref: 'Matthew 28:19-20', topics: ['evangelism'], use: 'quoted', usedBy: ['disciple_maker'], context: 'The risen Jesus commissions his disciples — making disciples includes teaching, not only first decisions.' },
  { ref: 'Romans 10:14-15', topics: ['evangelism'], use: 'quoted', usedBy: ['missionary_journey'], context: 'Paul explains why the message must be carried and spoken.' },
  { ref: '1 Peter 3:15-16', topics: ['evangelism', 'perseverance'], use: 'quoted', usedBy: ['chidis_questions', 'classroom_mockery'], context: 'Peter writes to believers facing slander: give reasons for hope, with humility and a clear conscience.' },
  { ref: 'Colossians 4:6', topics: ['evangelism'], use: 'quoted', usedBy: ['chidis_questions'], context: 'Instructions on how believers speak with outsiders.' },
  { ref: 'John 3:16', topics: ['grace', 'evangelism'], use: 'quoted', usedBy: [], context: 'From Jesus’ conversation with Nicodemus, a religious leader who came at night with questions.' },
  { ref: 'Romans 5:8', topics: ['grace'], use: 'quoted', usedBy: ['emeka_why'], context: 'Paul on God’s love shown while people were still sinners.' },
  { ref: 'Ephesians 2:8-10', topics: ['grace', 'judgment'], use: 'quoted', usedBy: ['ending'], context: 'Salvation by grace through faith, not by works — and good works as the fruit, not the price.' },
  { ref: 'Proverbs 11:1', topics: ['integrity'], use: 'quoted', usedBy: ['honest_scales', 'falsify_report'], context: 'A proverb about honest weights and measures in the marketplace.' },
  { ref: 'Luke 16:10-11', topics: ['integrity', 'stewardship'], use: 'quoted', usedBy: ['faithful_steward', 'falsify_report'], context: 'Jesus’ teaching after the parable of the shrewd manager.' },
  { ref: 'Colossians 3:23', topics: ['work'], use: 'quoted', usedBy: ['honest_work'], context: 'Originally addressed to household workers, giving ordinary labour dignity before the Lord.' },
  { ref: 'Proverbs 21:5', topics: ['stewardship', 'work'], use: 'quoted', usedBy: ['faithful_steward'], context: 'A proverb on diligent planning versus haste.' },
  { ref: '1 Timothy 6:17-19', topics: ['stewardship', 'generosity'], use: 'quoted', usedBy: ['windfall'], context: 'Paul’s charge to wealthy believers: not arrogance, but generosity and hope in God.' },
  { ref: 'Luke 12:15', topics: ['stewardship'], use: 'quoted', usedBy: ['windfall'], context: 'Jesus’ warning against greed, introducing the parable of the rich fool.' },
  { ref: 'James 1:12', topics: ['perseverance'], use: 'quoted', usedBy: ['steadfast', 'grounded'], context: 'James on enduring trials.' },
  { ref: 'Matthew 5:11-12', topics: ['perseverance'], use: 'quoted', usedBy: ['classroom_mockery'], context: 'The final beatitude, about insult and persecution for Jesus’ sake.' },
  { ref: 'Matthew 10:16', topics: ['perseverance'], use: 'quoted', usedBy: ['fellowship_threat', 'grounded'], context: 'Jesus sending out the Twelve: wisdom and innocence together.' },
  { ref: 'Mark 10:43-45', topics: ['service'], use: 'quoted', usedBy: ['servants_heart'], context: 'Jesus answers his disciples’ argument about greatness.' },
  { ref: 'Matthew 25:35-40', topics: ['service'], use: 'quoted', usedBy: ['i_was_hungry'], context: 'Part of Jesus’ teaching about the Son of Man’s judgment of the nations.' },
  { ref: 'Galatians 6:2', topics: ['service', 'fellowship'], use: 'quoted', usedBy: ['debts_and_dawn'], context: 'Paul on restoring and supporting one another.' },
  { ref: 'Psalms 34:18', topics: ['suffering'], use: 'quoted', usedBy: ['chidi_suffering'], context: 'A psalm of David, giving thanks after deliverance.' },
  { ref: 'John 11:35', topics: ['suffering'], use: 'quoted', usedBy: ['chidi_suffering'], context: 'Jesus at the tomb of his friend Lazarus, moments before raising him.' },
  { ref: '1 Timothy 5:8', topics: ['family'], use: 'quoted', usedBy: ['uncle_fees'], context: 'Part of Paul’s instructions about caring for widows and family responsibility.' },
  { ref: 'Ephesians 6:1-3', topics: ['family'], use: 'quoted', usedBy: [], context: 'Paul’s household instructions, citing the commandment to honour parents.' },
  { ref: 'Acts 2:42', topics: ['fellowship'], use: 'quoted', usedBy: ['bible_study_circle', 'debts_and_dawn'], context: 'A description of the first Jerusalem believers after Pentecost.' },
  { ref: 'Hebrews 10:24-25', topics: ['fellowship'], use: 'quoted', usedBy: ['emeka_why'], context: 'An encouragement not to abandon meeting together.' },
  { ref: '2 Corinthians 5:10', topics: ['judgment'], use: 'quoted', usedBy: ['ending'], context: 'Paul writes of believers’ accountability before Christ.' },
  { ref: 'Romans 14:10-12', topics: ['judgment'], use: 'quoted', usedBy: ['ending'], context: 'In a passage about not judging fellow believers over disputable matters, Paul reminds that each gives account to God.' },
  { ref: 'Matthew 25:31-46', topics: ['judgment', 'service'], use: 'quoted', usedBy: ['ending'], context: 'Jesus’ teaching about the judgment of the nations and care for “the least of these”. Interpretations of who “the least of these” are differ among Christians.' },
  { ref: '1 Corinthians 15:51-52', topics: ['return'], use: 'quoted', usedBy: ['ending'], context: 'Paul on the resurrection of the dead and the transformation of believers “at the last trumpet”.' },
  { ref: '1 Thessalonians 4:16-17', topics: ['return'], use: 'quoted', usedBy: ['ending'], context: 'Paul comforts grieving believers about those who have died. Christians differ on how this passage fits other end-times texts.' },
  { ref: 'Acts 16:11-15', topics: ['evangelism', 'prayer'], use: 'quoted', usedBy: ['walk_to_river'], context: 'Luke’s account of Paul’s companions arriving in Philippi and meeting Lydia at a riverside place of prayer.' },
];

// Passages used in the ending sequence, in order. Text is fetched from the Bible data.
export const ENDING_PASSAGES = [
  { ref: '1 Corinthians 15:51-52', heading: 'The trumpet' },
  { ref: '1 Thessalonians 4:16-17', heading: 'The Lord’s return' },
  { ref: '2 Corinthians 5:10', heading: 'Accountability' },
  { ref: 'Romans 14:10-12', heading: 'Each will give account' },
  { ref: 'Matthew 25:34-40', heading: '“The least of these”', fullRef: 'Matthew 25:31-46' },
  { ref: 'Ephesians 2:8-10', heading: 'By grace' },
];
