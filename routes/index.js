var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var InviteRequest = mongoose.model('InviteRequest');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* POST for new invite request */
router.route('/new')
  .post(function(req, res){
    var invite = new InviteRequest(req.body);
    invite.save(function (err, result){
      if (err)
        return res.send(500, err);
      return res.json(result);
    });
  });

module.exports = router;
