import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const UserSchema = new Schema(
  {
    email: { type: String, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, select: false },
    displayName: { type: String, required: true, trim: true, maxlength: 40 },
    isGuest: { type: Boolean, default: false },
  },
  { timestamps: true },
);
UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });
export const User = model('User', UserSchema);

const CharacterSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, maxlength: 24 },
    status: { type: String, enum: ['active', 'ended'], default: 'active' },
    mode: { type: String, enum: ['free', 'mission'], required: true },
    // Optimistic-concurrency revision: every authoritative write requires the expected rev.
    rev: { type: Number, default: 0 },
    // The full simulation save. Bounded: inventory, logs and notes are capped by the engine;
    // unbounded history lives in LifeEvent / JournalEntry / ActionRecord collections.
    state: { type: Schema.Types.Mixed, required: true },
    // Server-only secrets: never selected by default, never sent to the client.
    secret: { type: String, select: false },
    endAtMinutes: { type: Number, select: false, default: null },
    lastSyncAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    summary: {
      level: Number,
      age: Number,
      coins: Number,
      mapId: String,
      date: String,
    },
  },
  { timestamps: true, minimize: false },
);
export const Character = model('Character', CharacterSchema);

// Idempotency + audit record for every authoritative action. Unique per character+key.
const ActionRecordSchema = new Schema(
  {
    characterId: { type: Schema.Types.ObjectId, required: true },
    key: { type: String, required: true, maxlength: 64 },
    type: { type: String, required: true },
    status: { type: String, enum: ['pending', 'applied'], default: 'pending' },
    coinsDelta: { type: Number, default: 0 },
    ledger: [{ delta: Number, reason: String, _id: false }],
    result: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);
ActionRecordSchema.index({ characterId: 1, key: 1 }, { unique: true });
export const ActionRecord = model('ActionRecord', ActionRecordSchema);

const LifeEventSchema = new Schema(
  {
    characterId: { type: Schema.Types.ObjectId, required: true, index: true },
    at: { type: Number, required: true },
    date: String,
    kind: String,
    title: { type: String, maxlength: 200 },
    detail: { type: String, maxlength: 600 },
    weight: { type: Number, default: 1 },
    tags: [String],
  },
  { timestamps: true },
);
LifeEventSchema.index({ characterId: 1, at: 1 });
export const LifeEvent = model('LifeEvent', LifeEventSchema);

const JournalEntrySchema = new Schema(
  {
    characterId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true },
    at: Number,
    date: String,
    prayerType: String,
    place: String,
    target: String,
    text: { type: String, maxlength: 1000 },
  },
  { timestamps: true },
);
export const JournalEntry = model('JournalEntry', JournalEntrySchema);

const PlayerSettingsSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, unique: true },
    musicVolume: { type: Number, min: 0, max: 1, default: 0.5 },
    sfxVolume: { type: Number, min: 0, max: 1, default: 0.7 },
    muted: { type: Boolean, default: false },
    reducedMotion: { type: Boolean, default: false },
    textScale: { type: Number, min: 0.85, max: 1.5, default: 1 },
    touchControls: { type: String, enum: ['auto', 'on', 'off'], default: 'auto' },
  },
  { timestamps: true },
);
export const PlayerSettings = model('PlayerSettings', PlayerSettingsSchema);

const ScriptureFavoriteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    ref: { type: String, required: true, maxlength: 60 },
    note: { type: String, maxlength: 300, default: '' },
  },
  { timestamps: true },
);
ScriptureFavoriteSchema.index({ userId: 1, ref: 1 }, { unique: true });
export const ScriptureFavorite = model('ScriptureFavorite', ScriptureFavoriteSchema);
