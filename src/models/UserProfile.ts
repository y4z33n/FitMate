import mongoose from 'mongoose';

const UserProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  fitnessGoals: {
    type: [String],
    default: [],
  },
  fitnessLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true,
  },
  medicalConditions: {
    type: [String],
    default: [],
  },
  dietaryRestrictions: {
    type: [String],
    default: [],
  },
  workoutPreferences: {
    type: [String],
    default: [],
  },
  equipmentAccess: {
    type: [String],
    default: [],
  },
  availableTime: {
    type: Number, // minutes per day
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.UserProfile || mongoose.model('UserProfile', UserProfileSchema); 