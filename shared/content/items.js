// Item definitions. Prices are fictional game-balancing values in Life Coins (LC).
// sellRatio: fraction of price returned when sold back. sellable:false = mission / keepsake items.
export const ITEMS = [
  // Food & consumables
  { id: 'akara_pap', name: 'Akara & pap', category: 'food', price: 400, stackable: true, use: { energy: 15, wellbeing: 2 }, icon: 'food', description: 'Bean fritters with warm pap. A proper breakfast.' },
  { id: 'jollof_plate', name: 'Plate of jollof rice', category: 'food', price: 1200, stackable: true, use: { energy: 30, wellbeing: 5 }, icon: 'food', description: 'Smoky party-style jollof with plantain.' },
  { id: 'suya', name: 'Suya wrap', category: 'food', price: 900, stackable: true, use: { energy: 20, wellbeing: 4 }, icon: 'food', description: 'Spiced grilled beef in newspaper.' },
  { id: 'bread', name: 'Loaf of bread', category: 'food', price: 600, stackable: true, use: { energy: 12 }, icon: 'food', description: 'Soft agege-style bread.' },
  { id: 'water_pack', name: 'Pack of sachet water', category: 'food', price: 300, stackable: true, use: { energy: 6, health: 1 }, icon: 'water', description: 'Twenty sachets. Stay hydrated.' },
  { id: 'fruit_basket', name: 'Fruit basket', category: 'gift', price: 2500, stackable: true, use: { energy: 18, health: 2 }, giftable: true, icon: 'gift', description: 'Oranges, bananas and pawpaw. A thoughtful gift.' },
  { id: 'foodstuff_bag', name: 'Bag of foodstuff', category: 'gift', price: 6000, stackable: true, giftable: true, icon: 'gift', description: 'Rice, beans, garri and oil — enough to help a family for a week.' },
  { id: 'gift_hamper', name: 'Gift hamper', category: 'gift', price: 9000, stackable: true, giftable: true, icon: 'gift', description: 'A festive hamper for someone special.' },
  // Books
  { id: 'bible', name: 'Bible (World English Bible)', category: 'book', price: 1500, stackable: true, giftable: true, icon: 'bible', description: 'A printed Bible. You can give one away as a gift.' },
  { id: 'study_notes', name: 'Study guide', category: 'book', price: 2500, stackable: false, icon: 'book', boosts: { study: 0.2 }, description: '+20% study progress while you own it.' },
  { id: 'coding_book', name: 'Coding for beginners', category: 'book', price: 5000, stackable: false, icon: 'book', boosts: { skill_tech: 1 }, description: 'Each study session also builds tech skill.' },
  { id: 'devotional', name: 'Devotional journal', category: 'book', price: 2000, stackable: false, icon: 'book', description: 'A blank journal for prayer reflections.' },
  // Clothing
  { id: 'ankara_outfit', name: 'Ankara outfit', category: 'clothing', price: 6000, stackable: false, icon: 'clothing', use: { wellbeing: 3 }, description: 'Bright, tailored Ankara. Looks sharp at church and parties.' },
  { id: 'corporate_outfit', name: 'Corporate outfit', category: 'clothing', price: 15000, stackable: false, icon: 'clothing', description: 'Required for office interviews at Brightwell.' },
  { id: 'scrubs', name: 'Clinic scrubs', category: 'clothing', price: 8000, stackable: false, icon: 'clothing', description: 'Required for clinic roles.' },
  // Tools
  { id: 'phone', name: 'Smartphone', category: 'tool', price: 45000, stackable: false, icon: 'phone', description: 'Stay in touch. Required for delivery work.' },
  { id: 'laptop', name: 'Laptop', category: 'tool', price: 180000, stackable: false, icon: 'laptop', boosts: { study: 0.25 }, description: 'Required for developer roles. +25% study progress.' },
  { id: 'sewing_machine', name: 'Sewing machine', category: 'tool', price: 60000, stackable: false, icon: 'tool', description: 'Lets you run a tailoring business.' },
  { id: 'farm_tools', name: 'Hoe & seed set', category: 'tool', price: 4000, stackable: false, icon: 'tool', description: 'Needed to farm in Nkwo.' },
  { id: 'guitar', name: 'Acoustic guitar', category: 'tool', price: 35000, stackable: false, icon: 'music', boosts: { skill_music: 1 }, description: 'Practise anywhere. Required for paid gigs.' },
  // Furniture
  { id: 'mattress', name: 'Orthopaedic mattress', category: 'furniture', price: 30000, stackable: false, icon: 'furniture', boosts: { sleep: 15 }, description: 'Sleep restores 15 extra energy.' },
  { id: 'standing_fan', name: 'Standing fan', category: 'furniture', price: 18000, stackable: false, icon: 'furniture', boosts: { sleep: 5 }, description: 'Cooler nights, better rest.' },
  { id: 'generator', name: 'Small generator', category: 'furniture', price: 95000, stackable: false, icon: 'furniture', boosts: { study: 0.1 }, description: 'Power when the grid is down. +10% study.' },
  // Vehicles
  { id: 'bicycle', name: 'Bicycle', category: 'vehicle', price: 40000, stackable: false, icon: 'bike', description: 'Required for delivery riding.' },
  { id: 'keke', name: 'Keke (tricycle)', category: 'vehicle', price: 900000, stackable: false, icon: 'keke', description: 'Run a keke transport business from the motor park.' },
  { id: 'car', name: 'Used saloon car', category: 'vehicle', price: 3500000, stackable: false, icon: 'car', use: { wellbeing: 1 }, description: 'Comfort and status. Cheaper travel to Nkwo.' },
  // Mission & keepsake items
  { id: 'purple_swatch', name: 'Swatch of purple cloth', category: 'collectible', price: 0, stackable: false, sellable: false, icon: 'collectible', description: 'A keepsake from Philippi (historical scenario).' },
  { id: 'thank_you_card', name: "Nneka's thank-you card", category: 'collectible', price: 0, stackable: false, sellable: false, icon: 'collectible', description: 'Hand-drawn by Nneka’s children.' },
  { id: 'stall_stock', name: 'Provisions stock (unit)', category: 'stock', price: 400, stackable: true, sellable: false, icon: 'crate', description: 'Stock for your market stall business.' },
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export const SELL_RATIO = 0.5;

export const SHOPS = {
  oja_food: { id: 'oja_food', name: 'Oja Market food stall', mapId: 'udoka', items: ['akara_pap', 'jollof_plate', 'suya', 'bread', 'water_pack', 'fruit_basket'], buysCategories: [] },
  oja_goods: { id: 'oja_goods', name: 'Oja Market goods', mapId: 'udoka', items: ['ankara_outfit', 'corporate_outfit', 'scrubs', 'bible', 'study_notes', 'coding_book', 'devotional', 'farm_tools', 'phone', 'guitar', 'sewing_machine'], buysCategories: ['clothing', 'book', 'tool'] },
  ngozi: { id: 'ngozi', name: "Mama Ngozi's Provisions", mapId: 'shop', items: ['bread', 'water_pack', 'foodstuff_bag', 'gift_hamper', 'fruit_basket', 'mattress', 'standing_fan', 'generator', 'laptop'], buysCategories: ['food', 'gift', 'furniture', 'tool'] },
  motors: { id: 'motors', name: 'Udoka Motors', mapId: 'udoka', items: ['bicycle', 'keke', 'car'], buysCategories: ['vehicle'] },
  nkwo_market: { id: 'nkwo_market', name: 'Nkwo market stall', mapId: 'nkwo', items: ['akara_pap', 'water_pack', 'fruit_basket', 'farm_tools', 'foodstuff_bag'], buysCategories: ['food', 'gift'] },
};

export const PROPERTIES = [
  { id: 'flat_amaka', name: 'Two-bedroom flat, Amaka Close', region: 'udoka', price: 6000000, effect: 'No more monthly rent. Your home becomes yours.', removesRent: true },
  { id: 'market_stall_lease', name: 'Permanent stall, Oja Market', region: 'udoka', price: 450000, effect: 'Stall business pays no daily stall fee.', removesStallFee: true },
  { id: 'farmland_nkwo', name: 'Farmland plot, Nkwo', region: 'nkwo', price: 250000, effect: 'Lets you farm in Nkwo.', enablesFarm: true },
];
export const PROPERTY_BY_ID = Object.fromEntries(PROPERTIES.map((p) => [p.id, p]));
