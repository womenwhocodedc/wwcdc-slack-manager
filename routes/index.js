var express = require('express');
var mongoose = require('mongoose');
var request = require('request');
var router = express.Router();
var config = require('../config');
var InviteRequest = mongoose.model('InviteRequest');

/* GET home page. */
router.get('/', function (req, res, next) {
  InviteRequest.find()
    .exec(function (err, results) {
      if (err)
        return res.send(500, err);
      res.render('index', {title: 'WWC DC Slack Invite Requests', requests: results});
    });
});

/* POST to approve invite request */
router.route('/approve')
  .post(function (req, res) {
    InviteRequest.findOne({_id: req.body.id})
      .exec(function (err, inviteReq) {
        if (err) {
          return renderError(err, req, res);
        }

        // POST to slack API to invite user
        request.post({
          url: 'https://' + config.slackUrl + '/api/users.admin.invite',
          form: {
            /* TODO: implement auto join channels */
            first_name: inviteReq.firstName,
            last_name: inviteReq.lastName,
            email: inviteReq.email,
            token: config.slackToken,
            set_active: true
          }
        }, function (err, httpResponse, body) {
          if (err) {
            return renderError(err, req, res);
          }
          body = JSON.parse(body);
          if (body.ok) {
            inviteReq.status = "approved";
            inviteReq.save(function (saveErr, saved) {
              if (saveErr) {
                return renderError(saveErr, req, res);
              }

              // redirect to home page and show success message
              req.flash('message', 'Approved "' + inviteReq.email + '"');
              res.redirect('/');
            });
          } else {
            var error = body.error;
            if (error === 'already_invited' || error === 'already_in_team') {
              error = 'Slack Error: ' + error;
            } else if (error === 'invalid_email') {
              error = 'The email you entered is an invalid email.'
            } else if (error === 'invalid_auth') {
              error = 'Something has gone wrong. Please contact a system administrator.'
            }

            return renderError(error, req, res);
          }
        });
      });
  });

/* POST for new invite request */
router.route('/invite-request')
  .post(function (req, res) {
    var invite = new InviteRequest(req.body);
    invite.save(function (err, result) {
      if (err)
        return res.send(500, err);
      return res.json(result);
    });
  });

function renderError(err, req, res){
  req.flash('error', err);
  return res.redirect('/');
}
module.exports = router;