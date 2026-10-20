// Creates a demo account with one character so you can jump straight in.
// Usage: npm run seed   (email: demo@lifeforjesus.local / password: demo-password-123)
import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from '../db.js';
import { User, Character } from '../models/index.js';
import { createCharacter } from '../services/characters.js';

await connectDb();
const email = 'demo@lifeforjesus.local';
let user = await User.findOne({ email });
if (!user) user = await User.create({ email, passwordHash: await bcrypt.hash('demo-password-123', 12), displayName: 'Demo Player' });
if (!(await Character.exists({ userId: user._id }))) {
  await createCharacter(user._id, {
    name: 'Amara', gender: 'female', skin: 'chestnut', hair: 'braids', hairColor: 'black', outfit: 'ankara_blue',
    startAge: 'graduate', background: 'teachers_child', difficulty: 'standard', mode: 'mission', endingMode: 'surprise', country: 'ng',
  });
}
console.log(`Demo account ready: ${email} / demo-password-123`);
await disconnectDb();
