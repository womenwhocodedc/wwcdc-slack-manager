/**
 * Created by Pam on 2/16/2016.
 */
var config = require('./config');
var LocalStrategy = require('passport-local').Strategy;

module.exports = function(passport) {
  passport.serializeUser(function(user, done){
    console.log('serializing user: ', user);
    done(null, user);
  });

  passport.deserializeUser(function(user, done){
    console.log('deserializing user: ', user);
    done(null, user);
  });

  passport.use('login', new LocalStrategy({
      passReqToCallback: true
    },
    function (req, username, password, done) {
      if (username === config.userName) {
        if (password === config.userPass) {
          // complete authentication when username and user password match config values
          return done(null, username);
        }
        return done(null, false, req.flash('error', 'Invalid password'));
      }
      return done(null, false, req.flash('error', 'User not found.'));
    }
  ));
};