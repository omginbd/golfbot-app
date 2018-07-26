const mongoose = require('mongoose')

const schema = new mongoose.Schema(
  {
    name: String,
    scores: [Number]
  },
  {
    versionKey: false
  }
)

module.exports = mongoose.model('Participant', schema)
