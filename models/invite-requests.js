var mongoose = require('mongoose');

var inviteRequestSchema = new mongoose.Schema({
  formId: { type: String, required: true },
  firstName: String,
  lastName: String,
  email: { type: String, required: true },
  interests: [String],
  verification: String,
  created_at: { type: Date, default: Date.now },
  status: { type: String, default: "pending" }
});

mongoose.model('InviteRequest', inviteRequestSchema);