var mongoose = require('mongoose');
var request = require('request');
var config = require('../config');

var InviteRequest = mongoose.model('InviteRequest');
var ChannelInterest = mongoose.model('ChannelInterest');

module.exports = {
    approveInviteId: approveInviteId,
    postToSlack: postToSlack,
    renderError: renderError
};

function approveInviteId(id, req, res, errorCallback, successCallback) {
    InviteRequest.findOne({ _id: id })
        .exec(function (err, inviteReq) {
            if (err) {
                return errorCallback(err.message, req, res);
            }
            if (!inviteReq) {
                var err = "error retrieving invite request for id=" + id;
                return errorCallback(err, req, res);
            }

            var optArray = formatStringArray(inviteReq.interests);
            ChannelInterest.find({
                interest: { $in: optArray }
            }).exec(function (err, channelInterests) {
                var channelsMap = mapChannels(channelInterests);
                var channels = Array.from(channelsMap).toString();

                sendInviteRequestToSlack(inviteReq, channels, req, res, errorCallback, successCallback);
            });
        });
}

function postToSlack(message, emoji, name, channel) {
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

function renderError(err, req, res) {
  postToSlack(err, ":fearful:", "Slack Invites App - Error");
  req.flash('error', err);
  return res.redirect('/');
}

function sendInviteRequestToSlack(inviteReq, channels, req, res, errorCallback, successCallback) {
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
}

function mapChannels(channelInterests) {
    var defaultJoinChannels = config.defaultJoinChannels;
    var defaultChannelIds = defaultJoinChannels.split(',');
    var channelsSet = new Set(defaultChannelIds);
    channelInterests.forEach(function (result) {
        channelsSet.add(result.channel);
    });
    return channelsSet;
}

function formatStringArray(stringArray) {
    var result = [];
    stringArray.forEach(function (opt) {
        // clean the format of the interest by removing spaces and making it lowercase
        result.push(opt.toLowerCase().replace(/\s+/g, ''));
    });
    return result;
} 