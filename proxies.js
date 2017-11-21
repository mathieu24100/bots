const commander = require('commander')
const request = require('request')
const fs = require('fs')

commander.unknownOption = function() {
  return
}

commander
  .version('1.0.1')
  .option('-H, --http', 'Scrapes HTTP(s) proxies')
  .option('-s, --sock', 'Scrapes SOCKS5 proxies')
  .option('-a, --all', 'Scrapes all proxy types')
  .option('-p, --page <n>', 'Number of pages to scrape default: 3')
  .option('-o, --output <n>', 'The file to dump proxies too')
  .option('-r, --remove', 'Don\'t remove the old proxy file')
  .option('-h, --showHelp', 'Shows help')
  .parse(process.argv)

if (commander.showHelp) commander.help()

var scraper = {
  pages: commander.page || 5,
  outFile: commander.output || 'proxy.txt',
  proxySites: [],
  parseLink: function(body) {
    body.replace(/<a class='timestamp-link' href='http:\/\/.*.html/g, function(text) {
      text = text.replace("<a class='timestamp-link' href='", '')
      scraper.requestSite(text, scraper.parseProxies)
    })
  },
  requestSite: function(site, cb) {
    request(site, function(error, response, body) {
      if (!error && response.statusCode != 200) return false
      cb(body)
    })
  },
  loadLinks: function() {
    for (var i = 0; i < scraper.proxySites.length; i++) {
      scraper.requestSite(scraper.proxySites[i], scraper.parseLink)
    }
  },
  parseProxies: function(body) {
    body = body.match(/\d{1,3}([.])\d{1,3}([.])\d{1,3}([.])\d{1,3}((:)|(\s)+)\d{1,8}/g) || [] //proxy regex
    for (var i = 0; i < body.length; i++) {
      if (body[i].match(/\d{1,3}([.])\d{1,3}([.])\d{1,3}([.])\d{1,3}(\s)+\d{1,8}/g)) { //clean whitespace
        body[i] = body[i].replace(/(\s)+/, ':') //clean whitespace
      }
    }
    fs.appendFileSync(scraper.outFile, body.join('\n') + '\n')
    console.log('Scraped', body.length + ' proxies', 'Saved to', scraper.outFile)
  }
}

if (commander.all) {
  scraper.proxySites = [
    'http://proxyserverlist-24.blogspot.co.uk/search?max-results=' + scraper.pages,
    'http://sslproxies24.blogspot.co.uk/search?max-results=' + scraper.pages,
    'http://socksproxylist24.blogspot.co.uk/search?max-results=' + scraper.pages,
    'http://www.vipsocks24.net/search?max-results=' + scraper.pages,
    'http://www.live-socks.net/search?max-results=' + scraper.pages,
    'http://www.socks24.org/search?max-results=' + scraper.pages
  ]
} else if (commander.http) {
  scraper.proxySites = [
    'http://proxyserverlist-24.blogspot.co.uk/search?max-results=' + scraper.pages,
    'http://sslproxies24.blogspot.co.uk/search?max-results=' + scraper.pages

  ]
} else if (commander.sock) {
  scraper.proxySites = [
    'http://socksproxylist24.blogspot.co.uk/search?max-results=' + scraper.pages,
    'http://www.vipsocks24.net/search?max-results=' + scraper.pages,
    'http://www.live-socks.net/search?max-results=' + scraper.pages,
    'http://www.socks24.org/search?max-results=' + scraper.pages
  ]
} else {
  console.warn('No proxy types selected, using all')
  scraper.proxySites = [
    'http://proxyserverlist-24.blogspot.co.uk/search?max-results=' + scraper.pages,
    'http://sslproxies24.blogspot.co.uk/search?max-results=' + scraper.pages,
    'http://socksproxylist24.blogspot.co.uk/search?max-results=' + scraper.pages,
    'http://www.vipsocks24.net/search?max-results=' + scraper.pages,
    'http://www.live-socks.net/search?max-results=' + scraper.pages,
    'http://www.socks24.org/search?max-results=' + scraper.pages
  ]
}

if (!commander.remove) try {
  fs.unlinkSync(scraper.outFile)
} catch (e) {}

scraper.loadLinks()
console.log('Starting...');