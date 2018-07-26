const express = require('express')
const morgan = require('morgan')

const app = express()
const router = express.Router()

const PORT = process.env.PORT || 3000

app.use(morgan('dev'))
app.use('/', router)
app.get('/', (req, res) => res.send('server is working!'))

app.listen(PORT, () => console.log(`Listening on port ${PORT}`))
