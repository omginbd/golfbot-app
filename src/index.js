const bodyParser = require('body-parser')
const config = require('config')
const cors = require('cors')
const express = require('express')
const mongoose = require('mongoose')
const morgan = require('morgan')

const { BadRequestError, NotFoundError, HttpError } = require('./errors')
const model = require('./model')

const wrap = fn => (req, res, next) =>
  fn(req, res, next).catch(err => next(err))

mongoose.connect(
  config.mongo.uri,
  config.mongo.options
)

const app = express()
app.use(morgan(config.log.format))
app.use(bodyParser.json())
app.use(cors())

app.post(
  '/api/participants',
  wrap(async (req, res) => {
    const { name } = req.body
    if (!name) throw new BadRequestError('name is required')
    const participant = await model.create({ name, scores: [] })
    res.send(participant)
  })
)

app.get(
  '/api/participants',
  wrap(async (req, res) => {
    const participants = await model.find()
    res.send(participants)
  })
)

app.get(
  '/api/participants/:id',
  wrap(async (req, res) => {
    const participant = await model.findOne({ _id: req.params.id })
    if (!participant) throw new NotFoundError()
    res.send(participant)
  })
)

app.put(
  '/api/participants/:id',
  wrap(async (req, res) => {
    const participant = await model.findOneAndUpdate(
      { _id: req.params.id },
      { $set: req.body },
      { new: true, upsert: false }
    )
    res.send(participant)
  })
)

app.delete(
  '/api/participants/:id',
  wrap(async (req, res) => {
    await model.deleteOne({ _id: req.params.id })
    res.send({ ok: true })
  })
)

app.use((err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.httpCode).send(err.message)
  }
  if (err instanceof mongoose.CastError) {
    return res.status(400).send('Bad Request')
  }
  console.error(err)
  res.sendStatus(500)
})

module.exports = app
  .listen(config.port)
  .on('listening', () => console.log(`Listening on port ${config.port}`))
