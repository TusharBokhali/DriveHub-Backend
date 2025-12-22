const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {type:String, required:true},
  email: {type:String, required:true, unique:true},
  password: {type:String, required: function() { return !this.googleId; }}, // hashed, optional if Google Sign-In
  googleId: {type:String, unique:true, sparse:true}, // Google user ID
  signInMethod: {type:String, enum:['email','google'], default:'email'}, // Track sign-in method
  role: {type:String, enum:['user','client','admin'], default:'user'},
  // Profile information
  phone: String,
  address: String,
  profileImage: String,
  // Client specific fields
  businessName: { type:String, required: function() { return this.role === 'client'; } },
  businessAddress: String,
  businessPhone: String,
  // User preferences
  preferredLanguage: { type:String, enum:['hindi','english','hinglish'], default:'hinglish' },
  // Favorites: store category identifiers (e.g., 'bike', 'car', or custom IDs)
  favoriteCategories: { type: [String], default: [] },
  // Item favorites: store Vehicle/Object IDs
  favoriteItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' }],
  // Push notification tokens (supports both FCM and Expo)
  // Format: Expo tokens start with "ExponentPushToken[...]"
  // FCM tokens are long strings without "ExponentPushToken" prefix
  pushTokens: [{ 
    type: String,
    default: []
  }],
  createdAt: {type:Date, default: Date.now}
});

module.exports = mongoose.model('User', userSchema);
