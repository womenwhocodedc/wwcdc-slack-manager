var express = require('express');
var mongoose = require('mongoose');
var fs = require('fs');
var request = require('request');
var router = express.Router();
var config = require('../config');
var InviteRequest = mongoose.model('InviteRequest');

/* GET home page. */
router.get('/', function (req, res, next) {
  InviteRequest.find().sort("-created_at")
    .exec(function (err, results) {
      if (err)
        return res.send(500, err);
      res.render('index', {title: 'WWC DC Slack Invite Requests', requests: results});
    });
});

/* POST to report something from slack */
router.route('/report-command')
  .post(function(req, res) {
    if (req.body.token === config.reportsToken){
      var isPublicChannel = !(req.body.channel_name === "directmessage" || req.body.channel_name === "privategroup");
      var displayName = (isPublicChannel ? 
                          "<#" + req.body.channel_id + "|" + req.body.channel_name + ">" 
                          : req.body.channel_name) ;
      var message = "*channel:* " + displayName + "\n*message:* " + req.body.text;
      postToSlack(message, ":exclamation:", "Report", config.reportsChannel);
      return res.send(200);
    }
  });

/* POST to approve invite request from site */
router.route('/approve')
  .post(function (req, res) {
    return approveInviteId(req.body.id, req, res, renderError, function(inviteReq){
      postToSlack(inviteReq.email + " has been approved to join slack.");
      // redirect to home page and show success message
      req.flash('message', 'Approved "' + inviteReq.email + '"');
      return res.redirect('/');
    })
  });

/* POST to approve invite request from slack command */
router.route('/approve-command')
  .post(function (req, res) {
    if (req.body.token === config.botToken && req.body.channel_id === config.allowedBotChannel) {
      return approveInviteId(req.body.text, req, res, function(err, req, res){
        postToSlack(err, ":fearful:", "Slack Invites App - Error");
        return res.send(200);
      }, function (inviteReq) {
        postToSlack(inviteReq.email + " has been approved to join slack.");
        return res.send(200);
      })
    } else {
      return renderErrorJson("wrong slack bot token or requesting channel", req, res);
    }
  });

/* POST for new invite request */
router.route('/invite-request')
  .post(function (req, res) {
    var invite = new InviteRequest(req.body);
    invite.save(function (err, result) {
      if (err) {
        postToSlack(err, ":fearful:", "Slack Invites App - Error");
        return res.send(500, err);
      }
      postToSlack(invite.firstName + " " + invite.lastName + " <" + invite.email + "> has requested to join slack."
      +"\nUse the following slash command from slack to approve directly: ```/approve "+result.id+"```");
      return res.json(result);
    });
  });

function approveInviteId(id, req, res, errorCallback, successCallback){
  InviteRequest.findOne({_id: id})
    .exec(function (err, inviteReq) {
      if (err) {
        return errorCallback(err.message, req, res);
      }
      if (!inviteReq){
        var err = "error retrieving invite request for id="+id;
        return errorCallback(err, req, res);
      }

      var channelsMap = mapChannels(inviteReq.interests);
      var channels = Array.from(channelsMap).toString();
      // POST to slack API to invite user
      request.post({
        url: 'https://' + config.slackUrl + '/api/users.admin.invite',
        form: {
          channels: channels,
          first_name: inviteReq.firstName,
          last_name: inviteReq.lastName,
          email: inviteReq.email,
          token: config.slackToken,
          set_active: true
        }
      }, function (err, httpResponse, body) {
        if (err) {
          return errorCallback(err, req, res);
        }
        body = JSON.parse(body);
        if (body.ok) {
          inviteReq.status = "approved";
          inviteReq.save(function (saveErr, saved) {
            if (saveErr) {
              return errorCallback(saveErr, req, res);
            }
            return successCallback(inviteReq);
          });
        } else {
          inviteReq.status = body.error;
          inviteReq.save(function (saveErr, saved) {
            if (saveErr) {
              return errorCallback(saveErr, req, res);
            }
          });

          var error = 'Slack Error: "' + inviteReq.email + '" - ' + body.error;
          return errorCallback(error, req, res);
        }
      });
    });
}

function renderError(err, req, res){
  postToSlack(err, ":fearful:", "Slack Invites App - Error");
  req.flash('error', err);
  return res.redirect('/');
}

function mapChannels(interests){
  var interestsLookup = JSON.parse(fs.readFileSync('../channel-interests-map.json', 'utf8'));
  var defaultJoinChannels = config.defaultJoinChannels;
  var defaultChannelIds = defaultJoinChannels.split(',');
  var channelsSet = new Set(defaultChannelIds);
  for (var i = 0; i < interests.length; i++){
    // clean the format of the interest by removing spaces and making it lowercase
    var interest = interests[i].toLowerCase().replace(/\s+/g, '');
    var channels = interestsLookup[interest];
    for (var j = 0 ; j < channels.length; j++){
      channelsSet.add(channels[j]);
    }
  }
  return channelsSet;
}

function postToSlack(message, emoji, name, channel){
  var userName = name || 'Slack Invites App';
  var slackChannel = channel || config.defaultPostChannel;
  var icon = emoji || ":rabbit:";
  request.post({
    url: 'https://' + config.slackUrl + '/api/chat.postMessage',
    form: {
      channel: slackChannel,
      username: userName,
      icon_emoji: icon,
      text: message,
      token: config.slackToken
    }
  });
}

module.exports = router;