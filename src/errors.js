class HttpError extends Error {
  constructor (code, message) {
    super(message)
    this.httpCode = code
  }
}

class BadRequestError extends HttpError {
  constructor (message) {
    super(400, message)
  }
}

class NotFoundError extends HttpError {
  constructor (message) {
    super(404, message || 'Not Found')
  }
}

module.exports = {
  HttpError,
  BadRequestError,
  NotFoundError
}
