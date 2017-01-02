var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var config = require('../config');
var slackService = require('../services/slack');

var InviteRequest = mongoose.model('InviteRequest');

/* POST for new invite request */
router.route('/request')
  .post(function (req, res) {
    var invite = new InviteRequest(req.body);
    invite.save(function (err, result) {
      if (err) {
        slackService.postToSlack(err, ":fearful:", "Slack Invites App - Error");
        return res.send(500, err);
      }
      slackService.postToSlack(invite.firstName + " " + invite.lastName + " <" + invite.email + "> has requested to join slack."
        + "\nUse the following slash command from slack to approve directly: ```/approve " + result.id + "```");
      return res.json(result);
    });
  });

/* POST to approve invite request from site */
router.route('/approve')
  .post(function (req, res) {
    return slackService.approveInviteId(req.body.id, req, res, slackService.renderError, function (inviteReq) {
      slackService.postToSlack(inviteReq.email + " has been approved to join slack.");
      // redirect to home page and show success message
      req.flash('message', 'Approved "' + inviteReq.email + '"');
      return res.redirect('/');
    })
  });

/* POST to approve invite request from slack command */
router.route('/approve-command')
  .post(function (req, res) {
    if (req.body.token === config.botToken && req.body.channel_id === config.allowedBotChannel) {
      return slackService.approveInviteId(req.body.text, req, res, function (err, req, res) {
        slackService.postToSlack(err, ":fearful:", "Slack Invites App - Error");
        return res.send(200);
      }, function (inviteReq) {
        slackService.postToSlack(inviteReq.email + " has been approved to join slack.");
        return res.send(200);
      })
    } else {
      return slackService.renderError("wrong slack bot token or requesting channel", req, res);
    }
  });

module.exports = router;