var express = require('express');
var router = express.Router();
var config = require('../config');
var slackService = require('../services/slack');

/* POST to report something from slack */
router.post('/', function (req, res) {
    if (req.body.token === config.reportsToken) {
        var isPublicChannel = !(req.body.channel_name === "directmessage" || req.body.channel_name === "privategroup");
        var displayName = (isPublicChannel ?
            "<#" + req.body.channel_id + "|" + req.body.channel_name + ">"
            : req.body.channel_name);
        var message = "*channel:* " + displayName + "\n*message:* " + req.body.text;
        slackService.postToSlack(message, ":exclamation:", "Report", config.reportsChannel);
        return res.send(200);
    } else {
        return res.status(500).send('invalid token');
    }
});

module.exports = router;