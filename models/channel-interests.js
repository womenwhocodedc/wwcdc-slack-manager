var mongoose = require('mongoose');

var channelInterestSchema = new mongoose.Schema({
  interest: { type: String, required: true },
  channel: { type: String, required: true }
});

mongoose.model('ChannelInterest', channelInterestSchema);