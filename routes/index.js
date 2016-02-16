var express = require('express');
var mongoose = require('mongoose');
var request = require('request');
var router = express.Router();
var config = require('../config');
var InviteRequest = mongoose.model('InviteRequest');

/* GET home page. */
router.get('/', function(req, res, next) {
  InviteRequest.find()
    .exec(function (err, results) {
      if (err)
        return res.send(500, err);
      res.render('index', { title: 'WWC DC Slack Invite Requests', requests: results });
    });
});

/* POST to approve invite request */
router.route('/approve')
  .post(function (req, res) {
    InviteRequest.findOne({ _id: req.body.id })
      .exec(function (err, inviteReq) {
        if (err)
          return res.send(500, err);

        request.post({
          url: 'https://' + config.slackUrl + '/api/users.admin.invite',
          form: { /* TODO: implement auto join channels */
            first_name: inviteReq.firstName,
            last_name: inviteReq.lastName,
            email: inviteReq.email,
            token: config.slackToken,
            set_active: true
          }
        }, function (err, httpResponse, body) {
          if (err) {
            return res.send(500, err);
          }
          body = JSON.parse(body);
          if (body.ok) {
            inviteReq.status = "approved";
            inviteReq.save(function (saveErr, saved) {
              if (saveErr)
                return res.send(500, saveErr);

              // redirect to home page
              res.redirect('/');
            });
          } else {
            var error = body.error;
            if (error === 'already_invited' || error === 'already_in_team') {
              return res.send(500, error);
            } else if (error === 'invalid_email') {
              error = 'The email you entered is an invalid email.'
            } else if (error === 'invalid_auth') {
              error = 'Something has gone wrong. Please contact a system administrator.'
            }
            return res.send(500, 'Failed! ' + error);
          }
        });
      });
  });

/* POST for new invite request */
router.route('/invite-request')
  .post(function(req, res){
    var invite = new InviteRequest(req.body);
    invite.save(function (err, result){
      if (err)
        return res.send(500, err);
      return res.json(result);
    });
  });

module.exports = router;
