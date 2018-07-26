module.exports = {
  port: 3000,
  log: {
    format: 'dev'
  },
  mongo: {
    uri: 'mongodb://localhost:27017/golfbot',
    options: { useNewUrlParser: true }
  }
}
