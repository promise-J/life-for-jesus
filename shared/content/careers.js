// Jobs, courses and businesses. Salaries are fictional balancing values (LC per shift).
// Requirements never depend on gender or background.
export const JOBS = [
  { id: 'market_porter', name: 'Market porter', employer: 'Oja Market', mapId: 'udoka', pay: 1200, hours: 8, energy: 30, skill: 'trade', requires: {}, schedule: [7, 18], blurb: 'Hard, honest work carrying loads for traders.' },
  { id: 'shop_assistant', name: 'Shop assistant', employer: "Mama Ngozi's Provisions", mapId: 'shop', pay: 1800, hours: 8, energy: 20, skill: 'trade', requires: {}, schedule: [7, 19], blurb: 'Serve customers, keep stock and books tidy.' },
  { id: 'delivery_rider', name: 'Delivery rider', employer: 'Brightwell Logistics', mapId: 'office', pay: 2400, hours: 8, energy: 28, skill: 'communication', requires: { items: ['bicycle', 'phone'] }, schedule: [8, 18], blurb: 'Packages across Udoka. Needs a bicycle and a phone.' },
  { id: 'office_assistant', name: 'Office assistant', employer: 'Brightwell Logistics', mapId: 'office', pay: 2900, hours: 8, energy: 18, skill: 'communication', requires: { qualifications: ['waec'], items: ['corporate_outfit'] }, schedule: [8, 17], promotesTo: 'operations_officer', blurb: 'Admin, reports and phones.' },
  { id: 'operations_officer', name: 'Operations officer', employer: 'Brightwell Logistics', mapId: 'office', pay: 4400, hours: 8, energy: 20, skill: 'communication', requires: { qualifications: ['waec'], promotionOnly: true }, schedule: [8, 17], blurb: 'Run dispatch and write the weekly reports.' },
  { id: 'junior_developer', name: 'Junior software developer', employer: 'Brightwell Tech Desk', mapId: 'office', pay: 6500, hours: 8, energy: 22, skill: 'tech', requires: { qualifications: ['coding_bootcamp'], items: ['laptop'] }, schedule: [9, 18], promotesTo: 'senior_developer', blurb: 'Build the delivery-tracking app.' },
  { id: 'senior_developer', name: 'Senior software developer', employer: 'Brightwell Tech Desk', mapId: 'office', pay: 10500, hours: 8, energy: 22, skill: 'tech', requires: { qualifications: ['coding_bootcamp'], promotionOnly: true }, schedule: [9, 18], blurb: 'Lead the tech desk.' },
  { id: 'engineer', name: 'Site engineer', employer: 'Brightwell Logistics', mapId: 'office', pay: 8500, hours: 8, energy: 25, skill: 'tech', requires: { qualifications: ['engineering_degree'] }, schedule: [8, 17], blurb: 'Warehouses, roads and the new depot.' },
  { id: 'teacher', name: 'Teacher', employer: 'Udoka Learning Centre', mapId: 'university_hall', pay: 3200, hours: 7, energy: 22, skill: 'teaching', requires: { qualifications: ['nce'] }, schedule: [8, 16], blurb: 'Teach evening and weekend classes.' },
  { id: 'nurse', name: 'Nurse', employer: 'Udoka Clinic', mapId: 'clinic', pay: 5200, hours: 10, energy: 30, skill: 'care', requires: { qualifications: ['nursing_diploma'], items: ['scrubs'] }, schedule: [7, 19], blurb: 'Long shifts, real difference.' },
  { id: 'doctor', name: 'House officer (doctor)', employer: 'Udoka Clinic', mapId: 'clinic', pay: 9500, hours: 10, energy: 34, skill: 'care', requires: { qualifications: ['mbbs'], items: ['scrubs'] }, schedule: [7, 19], blurb: 'The clinic is always busy.' },
  { id: 'church_admin', name: 'Church administrator', employer: 'Grace Chapel', mapId: 'church', pay: 2200, hours: 7, energy: 15, skill: 'communication', requires: {}, schedule: [9, 17], blurb: 'Bulletins, accounts and visitors.' },
  { id: 'assistant_pastor', name: 'Assistant pastor', employer: 'Grace Chapel', mapId: 'church', pay: 3600, hours: 8, energy: 20, skill: 'communication', requires: { qualifications: ['theology_diploma'] }, schedule: [8, 20], blurb: 'Preaching, visiting, counselling and admin.' },
  { id: 'musician', name: 'Gigging musician', employer: 'Udoka Community Centre', mapId: 'community_centre', pay: 3000, hours: 5, energy: 20, skill: 'music', requires: { items: ['guitar'], skills: { music: 25 } }, schedule: [16, 23], variablePay: 0.6, blurb: 'Weddings, parties and Friday nights. Pay varies.' },
  { id: 'farmhand', name: 'Farmhand', employer: 'Nkwo farms', mapId: 'nkwo', pay: 1500, hours: 8, energy: 32, skill: 'farming', requires: {}, schedule: [6, 17], blurb: 'Clearing, planting and harvesting.' },
];
export const JOB_BY_ID = Object.fromEntries(JOBS.map((j) => [j.id, j]));

export const COURSES = [
  { id: 'waec', name: 'Senior Secondary Certificate (evening classes)', fee: 15000, hours: 90, skill: 'communication', blurb: 'The foundation for most office roles.' },
  { id: 'business_cert', name: 'Small Business Management certificate', fee: 20000, hours: 60, skill: 'trade', blurb: 'Better margins for your stall or shop.' },
  { id: 'music_lessons', name: 'Music lessons', fee: 15000, hours: 45, skill: 'music', blurb: 'Learn to play and lead.' },
  { id: 'coding_bootcamp', name: 'Software development bootcamp', fee: 120000, hours: 240, skill: 'tech', requires: ['waec'], blurb: 'Leads to developer jobs.' },
  { id: 'nce', name: 'Certificate in Education (NCE)', fee: 60000, hours: 300, skill: 'teaching', requires: ['waec'], blurb: 'Qualifies you to teach.' },
  { id: 'theology_diploma', name: 'Diploma in Theology (Grace Bible Institute)', fee: 40000, hours: 240, skill: 'communication', requires: ['waec'], blurb: 'Bible, church history and pastoral care.' },
  { id: 'nursing_diploma', name: 'Nursing diploma', fee: 150000, hours: 480, skill: 'care', requires: ['waec'], blurb: 'Qualifies you to nurse.' },
  { id: 'engineering_degree', name: 'B.Eng Civil Engineering', fee: 350000, hours: 900, skill: 'tech', requires: ['waec'], blurb: 'A long road to engineering work.' },
  { id: 'mbbs', name: 'MBBS (Medicine)', fee: 600000, hours: 1500, skill: 'care', requires: ['waec'], blurb: 'The longest road. Years of study.' },
];
export const COURSE_BY_ID = Object.fromEntries(COURSES.map((c) => [c.id, c]));

// Qualifications that can be held but not studied here (from starting backgrounds).
export const EXTRA_QUALIFICATIONS = {
  bsc_general: { id: 'bsc_general', name: 'B.Sc. (General Studies)' },
};

export function qualificationName(id) {
  return COURSE_BY_ID[id]?.name || EXTRA_QUALIFICATIONS[id]?.name || id;
}

export const BUSINESSES = [
  {
    id: 'provisions_stall',
    name: 'Provisions stall at Oja Market',
    mapId: 'udoka',
    startup: 50000,
    dayFee: 1500,
    hours: 9,
    energy: 22,
    skill: 'trade',
    requires: {},
    usesStock: true,
    unitSell: 700,
    blurb: 'Buy stock at 400 a unit, sell at around 700. Sales depend on your trade skill and the day.',
  },
  {
    id: 'tailoring',
    name: 'Tailoring from home',
    mapId: 'udoka',
    startup: 10000,
    dayFee: 500,
    hours: 8,
    energy: 18,
    skill: 'trade',
    requires: { items: ['sewing_machine'] },
    revenue: [3000, 7500],
    blurb: 'Take orders for Ankara outfits. Needs a sewing machine.',
  },
  {
    id: 'keke_transport',
    name: 'Keke transport',
    mapId: 'udoka',
    startup: 15000,
    dayFee: 3000,
    hours: 10,
    energy: 28,
    skill: 'communication',
    requires: { items: ['keke'] },
    revenue: [7000, 12500],
    blurb: 'Run passengers from the motor park. Fuel is your biggest cost.',
  },
  {
    id: 'farm',
    name: 'Farm in Nkwo',
    mapId: 'nkwo',
    startup: 5000,
    dayFee: 800,
    hours: 9,
    energy: 30,
    skill: 'farming',
    requires: { items: ['farm_tools'], properties: ['farmland_nkwo'] },
    revenue: [2500, 8000],
    blurb: 'Yam, cassava and vegetables. Good seasons and bad ones.',
  },
];
export const BUSINESS_BY_ID = Object.fromEntries(BUSINESSES.map((b) => [b.id, b]));
