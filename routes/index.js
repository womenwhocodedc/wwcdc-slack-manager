var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

var InviteRequest = mongoose.model('InviteRequest');

/* GET home page. */
router.get('/', function (req, res, next) {
  InviteRequest.find().sort("-created_at")
    .exec(function (err, results) {
      if (err)
        return res.send(500, err);
      res.render('index', { title: 'WWC DC Slack Invite Requests', requests: results });
    });
});

module.exports = router;