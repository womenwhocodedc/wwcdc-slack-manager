/**
 * Created by Pam on 2/15/2016.
 * Since there's only 1 model now, it's directly in this index.js file
 * If more models are created, we can refactor to individual files per model
 */
var mongoose = require('mongoose');

var inviteRequestSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, required: true },
  interests: [String],
  created_at: { type: Date, default: Date.now }
});

mongoose.model('InviteRequest', inviteRequestSchema);