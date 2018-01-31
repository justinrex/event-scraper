const fetch = require('isomorphic-fetch')
const JSDOM = require('jsdom').JSDOM
const Events = require('../models/events')
const months = require('./months').months
const dateRegex = /(jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|jun(e)?|jul(y)?|aug(ust)?|sep(tember)?|oct(ober)?|nov(ember)?|dec(ember)?)\s+\d{1,2},\s+\d{4}/

module.exports = { 
  init: () => {
    months.forEach(async month => {
      const url = `https://www.events12.com/atlanta/${month}`
      const response = await fetch(url)
      const pageText = await response.text()
      const dom = new JSDOM(pageText)
      const articles = dom.window.document.querySelectorAll('article')
      let events = []

      articles.forEach(article => {
        const rawDate = article.querySelector('.date').textContent.toLowerCase()
        // const scrubbedDate = (rawDate.match(dateRegex) || [])[0]
        // new Date(scrubbedDate)
        // if (scrubbedDate == undefined) console.log(rawDate)
        
        events.push({
          title: article.querySelector('h3').textContent,
          date: rawDate,
        })
      })

      Events.save(events)
    })
  }
}
