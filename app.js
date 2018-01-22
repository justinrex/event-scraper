const express = require('express')
const fetch = require('isomorphic-fetch')
const jsdom = require('jsdom')

const app = express()
const { JSDOM } = jsdom

let titles = []

const init = async () => {
  const response = await fetch('https://www.events12.com/atlanta/')
  const pageText = await response.text()
  const dom = new JSDOM(pageText)
  const articles = dom.window.document.querySelectorAll('article')
  
  articles.forEach(article => {
    titles.push(`${article.querySelector('h3').textContent} : ${article.querySelector('.date').textContent}`)
  })
}

app.get('/', async (req, res) => {
  res.send(titles.join('<br />'))
})
app.listen(3000, () => {
  init()
  console.log('App listening on port 3000')
})