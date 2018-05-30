const express = require('express')
const session = require('cookie-session')
const request = require('request')
const bodyParser = require('body-parser')
const fs = require('fs')
const logger = require('../logger')

function start (opts) {
  let app = express()
  app.use(session({
    secret: opts.cookieSecret,
    name: opts.cookieName
  }))

  app.use(bodyParser.json())

  app.get('/', function (req, res, next) {
    if (Object.keys(req.session).length > 0) {
      res.send(req.session)
    } else {
      res.send({ cookie_monster_no_likey: true })
    }
  })

  app.post('/', function (req, res, next) {
    Object.keys(req.body).forEach(function (key) {
      req.session[key] = req.body[key]
    })

    res.send(req.session)
  })

  return {
    app: app,
    server: app.listen(opts.port, '127.0.0.1')
  }
}

function encodeFile (options) {
  return new Promise((resolve, reject) => {
    fs.readFile(options.inputFile, function (error, data) {
      if (error) {
        return reject(error)
      } else {
        let requestOptions = {
          url: `http://127.0.0.1:${options.port}`,
          method: 'POST',
          json: JSON.parse(data.toString())
        }

        request(requestOptions, (error, res, body) => {
          if (error) {
            return reject(error)
          }

          let dataPattern = new RegExp(`${options.cookieName}=(.+?);`)
          let sigPattern = new RegExp(`${options.cookieName}\\.sig=(.+?);`)
          let cookies = res.headers['set-cookie'].join(';')

          resolve({
            data: dataPattern.exec(cookies)[1],
            sig: sigPattern.exec(cookies)[1]
          })
        })
      }
    })
  })
}

function makeRequest (cookie, options) {
  let url = `http://127.0.0.1:${options.port}`

  let jar = request.jar()
  jar.setCookie(request.cookie(`${options.cookieName}=${cookie.data}`), url)
  jar.setCookie(request.cookie(`${options.cookieName}.sig=${cookie.sig}`), url)

  return new Promise((resolve, reject) => {
    request({ url: url, jar: jar, json: true }, (error, res, body) => {
      if (error) {
        logger.exception(error)
        return resolve(false)
      }

      if (!body.cookie_monster_no_likey) {
        if (cookie.ip) {
          logger.success(`Found secret for ${cookie.ip}:${cookie.port}: ${options.cookieSecret}`)
        } else {
          logger.success(`Found secret: ${options.cookieSecret}`)
        }

        return resolve(true)
      } else {
        return resolve(false)
      }
    })
  })
}

module.exports = {
  start: start,
  makeRequest: makeRequest,
  encodeFile: encodeFile
}
