// Character creation options. Appearance choices are cosmetic only and never restrict gameplay.
export const SKIN_TONES = [
  { id: 'umber', name: 'Umber', color: '#5a3825' },
  { id: 'mahogany', name: 'Mahogany', color: '#6f4630' },
  { id: 'chestnut', name: 'Chestnut', color: '#8a5a3b' },
  { id: 'caramel', name: 'Caramel', color: '#a8714a' },
  { id: 'honey', name: 'Honey', color: '#c68e5f' },
  { id: 'sand', name: 'Sand', color: '#e0b58c' },
];

export const HAIR_STYLES = [
  { id: 'lowcut', name: 'Low cut' },
  { id: 'afro', name: 'Afro' },
  { id: 'braids', name: 'Braids' },
  { id: 'bun', name: 'Puff bun' },
  { id: 'twists', name: 'Twists' },
  { id: 'gele', name: 'Gele headwrap' },
];

export const HAIR_COLORS = [
  { id: 'black', color: '#1b1412' },
  { id: 'brown', color: '#4a2e1f' },
  { id: 'auburn', color: '#7a3b22' },
  { id: 'grey', color: '#9c9a96' },
];

export const OUTFITS = [
  { id: 'ankara_blue', name: 'Blue Ankara', top: '#2f6fd6', accent: '#f2b632', bottom: '#2b2f45' },
  { id: 'ankara_green', name: 'Green Ankara', top: '#1f9d6b', accent: '#ffd166', bottom: '#2d3a2f' },
  { id: 'kaftan_white', name: 'White kaftan', top: '#f1ece2', accent: '#c49a43', bottom: '#d9d2c3' },
  { id: 'casual_red', name: 'Red tee & jeans', top: '#d64545', accent: '#ffffff', bottom: '#33507a' },
  { id: 'office_navy', name: 'Office navy', top: '#ffffff', accent: '#1f3a68', bottom: '#1f3a68' },
  { id: 'wrapper_purple', name: 'Purple wrapper', top: '#7b4bc4', accent: '#f6c35b', bottom: '#5d3696' },
];

export const GENDERS = [
  { id: 'male', name: 'Male' },
  { id: 'female', name: 'Female' },
];

export const COUNTRIES = [
  { id: 'ng', name: 'Nigeria', cities: [{ id: 'udoka', name: 'Udoka (fictional city)' }], available: true },
];

export const START_AGES = [
  { id: 'school_leaver', name: 'School leaver', age: 17, blurb: 'Fresh out of secondary school. The whole road is ahead of you.', qualifications: [] },
  { id: 'student', name: 'University hopeful', age: 19, blurb: 'You have your school certificate and big plans.', qualifications: ['waec'] },
  { id: 'graduate', name: 'New graduate', age: 23, blurb: 'Degree in hand, job market in front of you.', qualifications: ['waec', 'bsc_general'] },
  { id: 'mid_career', name: 'Mid-career restart', age: 32, blurb: 'You have worked before and are starting again in a new city.', qualifications: ['waec', 'bsc_general'] },
];

export const BACKGROUNDS = [
  { id: 'trader_family', name: 'Trader family', coins: 6000, skills: { trade: 15, communication: 5 }, blurb: 'You grew up helping at a market stall.' },
  { id: 'farming_family', name: 'Farming family', coins: 4000, skills: { farming: 20 }, blurb: 'Your people farm near Nkwo village.' },
  { id: 'teachers_child', name: "Teacher's child", coins: 5000, skills: { teaching: 15, communication: 5 }, blurb: 'Books were always on the table at home.' },
  { id: 'tech_curious', name: 'Tech-curious', coins: 5000, skills: { tech: 15 }, blurb: 'You taught yourself a little coding on a borrowed phone.' },
  { id: 'church_kid', name: 'Raised in church', coins: 4500, skills: { music: 10, communication: 10 }, blurb: 'You sang in the youth choir for years.' },
];

export const DIFFICULTIES = [
  { id: 'gentle', name: 'Gentle', costMultiplier: 0.7, blurb: 'Lower living costs. Good for exploring.' },
  { id: 'standard', name: 'Standard', costMultiplier: 1, blurb: 'Balanced pressure.' },
  { id: 'hard', name: 'Hard', costMultiplier: 1.3, blurb: 'Money is tight. Every choice costs something.' },
];

export const GAME_MODES = [
  { id: 'free', name: 'Free Life', blurb: 'Live your way. Missions and storylines are there when you find them.' },
  { id: 'mission', name: 'Mission Mode', blurb: 'A guided chain of missions with objectives, choices and consequences.' },
];

export const ENDING_MODES = [
  { id: 'surprise', name: 'Unexpected trumpet', blurb: 'Your story ends at a moment you will not know in advance — perhaps soon, perhaps after many years.' },
  { id: 'brief', name: 'Short journey', blurb: 'The trumpet sounds within the first season or so of play. Good for shorter sessions.' },
  { id: 'off', name: 'Open sandbox', blurb: 'No surprise ending. You can still read the life report at any time.' },
];

export const SKILLS = ['tech', 'trade', 'teaching', 'care', 'communication', 'farming', 'music'];
