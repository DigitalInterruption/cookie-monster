process.env.NODE_ENV = 'test'

const chai = require('chai')
const spies = require('chai-spies')
const http = require('chai-http')

global.chai = chai
global.should = global.chai.should()

global.chai.use(spies)
global.chai.use(http)

global.http = {
  get: (opts) => {
    return new Promise((resolve, reject) => {
      chai.request(opts.app)
        .get(opts.path)
        .set('Cookie', `${opts.cookieName}=${opts.cookieData}; ${opts.cookieName}.sig=${opts.cookieSignature}`)
        .end((_err, res) => {
          resolve(res)
        })
    })
  },
  post: (app, path, body) => {
    return new Promise((resolve, reject) => {
      chai.request(app)
        .post(path)
        .send(body)
        .end((_err, res) => {
          resolve(res)
        })
    })
  }
}
