module.exports = {
  mongoUrl: process.env.MONGODB_URL,
  slackUrl: process.env.SLACK_URL,
  slackToken: process.env.SLACK_TOKEN,
  userName: process.env.USER_NAME,
  userPass: process.env.USER_PASS,
  botToken: process.env.BOT_TOKEN,
  reportsToken: process.env.REPORTS_TOKEN,
  reportsChannel: process.env.REPORTS_CHANNEL,
  allowedBotChannel: process.env.ALLOWED_BOT_CHANNEL,
  defaultPostChannel: process.env.DEFAULT_POST_CHANNEL,
  defaultJoinChannels: process.env.DEFAULT_JOIN_CHANNELS
};