var express = require('express');
var router = express.Router();

module.exports = function (passport){
  /* GET login page. */
  router.get('/login', function (req, res) {
    if (req.isAuthenticated()) {
      res.redirect('/');
    } else {
      // Display the Login page
      res.render('login');
    }
  });

  /* Handle Login POST */
  router.post('/login', passport.authenticate('login', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  }));

  /* GET logout */
  router.get('/signout', function (req, res) {
    req.logout();
    res.redirect('/auth/login');
  });

  return router;
};