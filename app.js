const express = require('express')
const init = require('./project/lib/appInitialization').init
const Events = require('./project/models/events')

init()
const app = express()

const format = events => (
  events.reduce((accumulator, event) => (
    accumulator + `${event.title} ⚡ ${event.date} <br />`
  ),'')
)

app.get('/', (req, res) => {
  Events.all().then(events => {
    res.send(format(events))
  }).catch(err => console.log(err))
})

app.listen(3000, () => {
  console.log('App listening on port 3000')
})
