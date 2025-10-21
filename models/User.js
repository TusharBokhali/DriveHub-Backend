const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {type:String, required:true},
  email: {type:String, required:true, unique:true},
  password: {type:String, required:true}, // hashed
  role: {type:String, enum:['user','client'], default:'user'},
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
  createdAt: {type:Date, default: Date.now}
});

module.exports = mongoose.model('User', userSchema);
