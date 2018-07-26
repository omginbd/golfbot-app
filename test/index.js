/* eslint-env mocha */

const assert = require('assert')
const mongoose = require('mongoose')
const supertest = require('supertest')

const app = require('../src')
const model = require('../src/model')

const request = supertest(app)

describe('golfbot api', () => {
  let participant = null

  before(async () => {
    await model.deleteMany({})
  })

  after(() => {
    app.close()
    mongoose.disconnect()
  })

  it('fetches nobody', async () => {
    const resp = await request.get('/api/participants').expect(200)
    assert.deepEqual(resp.body, [])
  })

  it('creates participants', async () => {
    const resp = await request
      .post('/api/participants')
      .send({ name: 'Alice' })
      .expect(200)
    assert(resp.body._id)
    assert.equal(resp.body.name, 'Alice')
    assert.deepEqual(resp.body.scores, [])
    const resp2 = await request
      .post('/api/participants')
      .send({ name: 'Bob' })
      .expect(200)
    assert(resp2.body._id)
    assert.equal(resp2.body.name, 'Bob')
    assert.deepEqual(resp2.body.scores, [])
    const resp3 = await request
      .post('/api/participants')
      .send({ name: 'Christy' })
      .expect(200)
    assert(resp3.body._id)
    assert.equal(resp3.body.name, 'Christy')
    assert.deepEqual(resp3.body.scores, [])
    participant = resp.body
  })

  it('fails to create a participant with no name', async () => {
    const resp = await request
      .post('/api/participants')
      .send({})
      .expect(400)
    assert.equal(resp.text, 'name is required')
  })

  it('fetches participants', async () => {
    const resp = await request.get('/api/participants').expect(200)
    assert.equal(resp.body.length, 3)
    assert.deepEqual(resp.body.map(a => a.name).sort(), [
      'Alice',
      'Bob',
      'Christy'
    ])
  })

  it('fetches a single participant', async () => {
    const resp = await request
      .get(`/api/participants/${participant._id}`)
      .expect(200)
    assert.deepEqual(resp.body, participant)
  })

  it('returns 404 if participant not found', async () => {
    const resp = await request
      .get('/api/participants/5b59532c8daa0f23d45e22fa')
      .expect(404)
    assert.deepEqual(resp.text, 'Not Found')
  })

  it('returns 400 if id is invalid on get', async () => {
    const resp = await request.get('/api/participants/lol').expect(400)
    assert.deepEqual(resp.text, 'Bad Request')
  })

  it('updates a participant', async () => {
    const expected = { _id: participant._id, name: 'Daniel', scores: [1, 2, 3] }
    const resp = await request
      .put(`/api/participants/${participant._id}`)
      .send({ name: 'Daniel', scores: [1, 2, 3] })
      .expect(200)
    assert.deepEqual(resp.body, expected)
    const resp2 = await request
      .get(`/api/participants/${participant._id}`)
      .expect(200)
    assert.deepEqual(resp2.body, expected)
  })

  it('updates just a name', async () => {
    const expected = { _id: participant._id, name: 'Elaine', scores: [1, 2, 3] }
    const resp = await request
      .put(`/api/participants/${participant._id}`)
      .send({ name: 'Elaine' })
      .expect(200)
    assert.deepEqual(resp.body, expected)
    const resp2 = await request
      .get(`/api/participants/${participant._id}`)
      .expect(200)
    assert.deepEqual(resp2.body, expected)
  })

  it('updates just scores', async () => {
    const expected = { _id: participant._id, name: 'Elaine', scores: [8, 4, 9] }
    const resp = await request
      .put(`/api/participants/${participant._id}`)
      .send({ scores: [8, 4, 9] })
      .expect(200)
    assert.deepEqual(resp.body, expected)
    const resp2 = await request
      .get(`/api/participants/${participant._id}`)
      .expect(200)
    assert.deepEqual(resp2.body, expected)
  })

  it('updates nothing', async () => {
    const expected = { _id: participant._id, name: 'Elaine', scores: [8, 4, 9] }
    const resp = await request
      .put(`/api/participants/${participant._id}`)
      .send({})
      .expect(200)
    assert.deepEqual(resp.body, expected)
    const resp2 = await request
      .get(`/api/participants/${participant._id}`)
      .expect(200)
    assert.deepEqual(resp2.body, expected)
  })

  it('handles extraneous data', async () => {
    const expected = { _id: participant._id, name: 'Elaine', scores: [8, 4, 9] }
    const resp = await request
      .put(`/api/participants/${participant._id}`)
      .send({ bloop: 'blarp' })
      .expect(200)
    assert.deepEqual(resp.body, expected)
    const resp2 = await request
      .get(`/api/participants/${participant._id}`)
      .expect(200)
    assert.deepEqual(resp2.body, expected)
  })

  it('handles invalid data', async () => {
    const expected = { _id: participant._id, name: 'Elaine', scores: [8, 4, 9] }
    const resp = await request
      .put(`/api/participants/${participant._id}`)
      .send({ scores: 'wat' })
      .expect(400)
    assert.deepEqual(resp.text, 'Bad Request')
    const resp2 = await request
      .get(`/api/participants/${participant._id}`)
      .expect(200)
    assert.deepEqual(resp2.body, expected)
  })

  it('returns 400 if id is invalid on put', async () => {
    const resp = await request.put('/api/participants/lol').expect(400)
    assert.deepEqual(resp.text, 'Bad Request')
  })

  it('deletes a participant', async () => {
    const resp = await request
      .delete(`/api/participants/${participant._id}`)
      .expect(200)
    assert(resp.body.ok)
    const resp2 = await request.get('/api/participants').expect(200)
    assert.equal(resp2.body.length, 2)
    assert.deepEqual(resp2.body.map(a => a.name).sort(), ['Bob', 'Christy'])
  })

  it('returns 400 if id is invalid on delete', async () => {
    const resp = await request.delete('/api/participants/lol').expect(400)
    assert.deepEqual(resp.text, 'Bad Request')
  })

  it('returns 500 on unknown server errors', async () => {
    let consoleErrorCalled = false
    const consoleError = console.error
    console.error = () => (consoleErrorCalled = true)
    model.deleteOne = async () => {
      throw new Error('CRITICAL ERROR')
    }
    const resp = await request.delete('/api/participants/lol').expect(500)
    assert.deepEqual(resp.text, 'Internal Server Error')
    assert(consoleErrorCalled)
    console.error = consoleError
  })
})
