const rewire = require('rewire')
const subject = rewire('./index')
const request = require('request')
const path = require('path')

describe('lib/express-helper', () => {
  let helper, revertMocks
  let defaultStartOpts = {
    cookieSecret: 'keyboard cat',
    cookieName: 'session',
    port: 3000,
    inputFile: path.join(__dirname, '../../test/encode_sample.json')
  }

  afterEach('teardown server and revert mocks', async () => {
    if (revertMocks) {
      revertMocks()
    }

    if (helper && helper.server) {
      await helper.server.close()
    }
  })

  describe('#start', () => {
    it('should return the Express app in the `app` property', () => {
      helper = subject.start(defaultStartOpts)
      helper.should.have.property('app')
    })

    it('should return the server instance in the `server` property', () => {
      helper = subject.start(defaultStartOpts)
      helper.should.have.property('server')
    })

    it('should register the cookie-session middleware', () => {
      let sessionSpy = chai.spy(returns => {
        return (req, res, next) => { next() }
      })

      revertMocks = subject.__set__({
        session: sessionSpy
      })

      helper = subject.start(defaultStartOpts)
      sessionSpy.should.have.been.called.with({
        secret: 'keyboard cat',
        name: 'session'
      })
    })

    context('when the app receives a GET request', () => {
      beforeEach('setup server', () => {
        helper = subject.start(defaultStartOpts)
      })

      context('and the cookie is signed with a matching secret', () => {
        it('should respond with the session data', async () => {
          let res = await http.get({
            app: helper.app,
            path: '/',
            cookieName: 'session',
            cookieData: 'eyJmb28iOiJiYXIifQ==',
            cookieSignature: 'LVMVxSNPdU_G8S3mkjlShUD78s4'
          })

          res.body.should.eql({ foo: 'bar' })
        })
      })

      context('and the secret is different', () => {
        it('should return with the `cookie_monster_no_likey` property', async () => {
          let res = await http.get({
            app: helper.app,
            path: '/',
            cookieName: 'session',
            cookieData: 'eyJmb28iOiJiYXIifQ==',
            cookieSignature: 'LVMxSNPdU_G8S3mkjlShUD78s5'
          })

          res.body.should.eql({ cookie_monster_no_likey: true })
        })
      })

      context('and the cookie name is different', () => {
        it('should return with the `cookie_monster_no_likey` property', async () => {
          let res = await http.get({
            app: helper.app,
            path: '/',
            cookieName: 'invalid',
            cookieData: 'eyJmb28iOiJiYXIifQ==',
            cookieSignature: 'LVMVxSNPdU_G8S3mkjlShUD78s4'
          })

          res.body.should.eql({ cookie_monster_no_likey: true })
        })
      })
    })

    context('when the app receives a POST request', () => {
      beforeEach('setup server', () => {
        helper = subject.start(defaultStartOpts)
      })

      it('should copy the req body into the session and return the cookie', async () => {
        let res = await http.post(helper.app, '/', {
          foo: 'bar'
        })

        res.body.should.eql({
          foo: 'bar'
        })

        let cookies = res.header['set-cookie']
        cookies[0].should.match(/session=eyJmb28iOiJiYXIifQ==/)
        cookies[1].should.match(/session.sig=LVMVxSNPdU_G8S3mkjlShUD78s4/)
      })
    })
  })

  describe('#makeRequest', () => {
    context('when an error occurs', () => {
      let logger, res

      beforeEach('setup the mocks and execute the request', async () => {
        try {
          logger = { exception: chai.spy() }
          revertMocks = subject.__set__({ logger: logger })
          res = await subject.makeRequest({
            data: 'eyJmb28iOiJiYXIifQ==',
            sig: 'LVMVxSNPdU_G8S3mkjlShUD78s4',
            ip: '10.8.0.1',
            port: 80
          }, {
            cookieName: 'session',
            port: 3000
          })
        } catch (error) {
          console.log(error)
        }
      })

      it('logs the exception', () => {
        logger.exception.should.have.been.called()
      })

      it('resolves `false`', () => {
        res.should.be.false
      })
    })

    context('when the cookie secret is correct', () => {
      let res, logger

      beforeEach('setup the server and execute the request', async () => {
        logger = { success: chai.spy() }
        revertMocks = subject.__set__({ logger: logger })
        helper = subject.start(defaultStartOpts)
        res = await subject.makeRequest({
          data: 'eyJmb28iOiJiYXIifQ==',
          sig: 'LVMVxSNPdU_G8S3mkjlShUD78s4',
          ip: '10.8.0.1',
          port: 80
        }, {
          cookieSecret: 'keyboard cat',
          cookieName: 'session',
          port: 3000
        })
      })

      it('should log a success message', () => {
        logger.success.should.have.been.called.with(
          'Found secret for 10.8.0.1:80: keyboard cat'
        )
      })

      it('should resolve `true`', () => {
        res.should.be.true
      })
    })

    context('when the cookie secret is incorrect', () => {
      let res, logger

      beforeEach('setup the server and execute the request', async () => {
        logger = { success: chai.spy() }
        revertMocks = subject.__set__({ logger: logger })
        helper = subject.start(defaultStartOpts)
        res = await subject.makeRequest({
          data: 'eyJmb28iOiJiYXIifQ==',
          sig: 'LVMVxSNPdU_G8S3mkjlShUD78s4',
          ip: '10.8.0.1',
          port: 80
        }, {
          cookieName: 'incorrect',
          port: 3000
        })
      })

      it('should resolve `false`', () => {
        res.should.be.false
      })
    })
  })

  describe('#encodeFile', () => {
    beforeEach('setup server', () => {
      helper = subject.start(defaultStartOpts)
    })

    it('should resolve the data and signature cookies in `key=value` format', async () => {
      let res = await subject.encodeFile(defaultStartOpts)

      res.should.have.property('data')
      res.data.should.eql('eyJmb28iOiJiYXIifQ==')

      res.should.have.property('sig')
      res.sig.should.eql('LVMVxSNPdU_G8S3mkjlShUD78s4')
    })
  })
})
