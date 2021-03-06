var express = require('express');
var partials = require('express-partials');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('flash');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var models = require('./models');
var config = require('./config');
var report = require('./routes/report');
var invite = require('./routes/invite');
var auth = require('./routes/auth')(passport);
var index = require('./routes/index');
var initPassport = require('./passport-init');

var app = express();

// connect to mongodb database
mongoose.connect(config.mongoUrl);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('node-sass-middleware')({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(partials());

//// Initialize Passport/Session
app.use(session({
  secret: "wwcdc",
  saveUninitialized: true,
  resave: true,
  store: new MongoStore({
    mongooseConnection: mongoose.connection
  })
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
initPassport(passport);

app.use(function (req, res, next) {
  // if user is authenticated in the session, call the next() to call the next request handler
  // Passport adds this method to request object. A middleware is allowed to add properties to
  // request and response objects

  if (req.path === "/upcoming-events" || req.path === "/auth/login" || req.path === "/invite/request" || 
    req.path === "/invite/approve-command" || req.path === "/report" ||  
    req.isAuthenticated()) {
    return next();
  }

  // if the user is not authenticated then redirect them to the login page
  res.redirect('/auth/login');
});

// register routes
app.use('/', index);
app.use('/auth', auth);
app.use('/invite', invite);
app.use('/report', report);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
