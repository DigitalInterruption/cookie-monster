const rewire = require('rewire')
const subject = rewire('./cookie-monster')
const fs = require('fs')
const path = require('path')

describe('cookie-monster', () => {
  let revertMocks, processSpy, usageSpy, expressSpy, logger
  let validArgs = {
    batch: false,
    cookie: 'eyJmb28iOiJiYXIifQ==',
    name: 'session',
    signature: 'LVMVxSNPdU_G8S3mkjlShUD78s4',
    wordlist: '/valid',
    port: 3000,
    inputFile: '/cookie-samples',
    secret: 'keyboard cat'
  }

  let mockFs = {
    existsSync: (filePath) => {
      return filePath.match(/\/(valid|cookie-samples|wordlist|encode_sample)/)
    },
    readFile: (filePath, cb) => {
      if (filePath === '/wordlist') {
        cb(null, 'keyboard cat\nword1\nword2\nword3')
      } else if (filePath === '/invalid') {
        cb(new Error(), null)
      } else if (filePath === '/cookie-samples') {
        fs.readFile(path.join(__dirname, '../test/sample.json'), cb)
      } else if (filePath === '/encode_sample.json') {
        fs.readFile(path.join(__dirname, '../test/encode_sample.json'), cb)
      }
    }
  }

  let setupMocks = (options) => {
    usageSpy = chai.spy.interface({
      display: returns => true
    })

    logger = subject.__get__('logger')
    chai.spy.on(logger, ['error', 'success'])

    expressSpy = subject.__get__('express')
    chai.spy.on(expressSpy, ['makeRequest', 'start'])
    chai.spy.on(expressSpy, 'encodeFile', () => {
      return new Promise((resolve, reject) => {
        resolve({
          data: 'eyJmb28iOiJiYXIifQ==',
          sig: 'LVMVxSNPdU_G8S3mkjlShUD78s4'
        })
      })
    })

    mockFs.writeFile = chai.spy((path, content, cb) => {
      if (path === '/results.json') {
        cb(null)
      } else {
        cb(new Error('error'))
      }
    })

    revertMocks = subject.__set__({
      options: Object.assign({}, validArgs, options),
      usage: usageSpy,
      fs: mockFs
    })
  }

  afterEach('revert mocks', () => {
    if (revertMocks) {
      revertMocks()
    }

    chai.spy.restore()
  })

  describe('when invoked with the `-h` option', () => {
    it('should display the usage guidelines', async () => {
      setupMocks({ help: true })
      await subject.run()
      usageSpy.display.should.have.been.called()
    })
  })

  describe('when invoked with the `-b` option', () => {
    describe('if an input file is not specified', () => {
      it('should log an error', async () => {
        setupMocks({ batch: true, inputFile: null })
        await subject.run()
        logger.error.should.have.been.called.with(
          'An input file must be specified with the --input-file option.'
        )
      })
    })

    describe('if the input file does not exist', () => {
      it('should log an error', async () => {
        setupMocks({
          batch: true,
          inputFile: '/a_file_which_does_not_exist.fake'
        })

        await subject.run()
        logger.error.should.have.been.called.with(
          'The specified input file does not exist.'
        )
      })
    })

    it('should process all cookies/samples from the input file', async () => {
      setupMocks({ batch: true, wordlist: '/wordlist' })
      await subject.run()
      expressSpy.makeRequest.should.have.been.called.with({
        ip: '127.0.0.1',
        port: 80,
        data: 'eyJmb28iOiJiYXIifQ==',
        sig: 'LVMVxSNPdU_G8S3mkjlShUD78s4'
      })

      expressSpy.makeRequest.should.have.been.called.with({
        ip: '127.0.0.1',
        port: 3000,
        data: 'eyJmb28iOiJiYXIifQ==',
        sig: 'LVMVxSNPdU_G8S3mkjlShUD78s4'
      })

      expressSpy.makeRequest.should.have.been.called.with({
        ip: '127.0.0.1',
        port: 8080,
        data: 'eyJmb28iOiJiYXIifQ==',
        sig: 'LVMVxSNPdU_G8S3mkjlShUD78s5'
      })
    })

    it('should remove a sample from the dataset once the secret is solved', async () => {
      setupMocks({ batch: true, wordlist: '/wordlist' })
      await subject.run()
      expressSpy.makeRequest.should.have.been.called.exactly(6)
    })
  })

  describe('when not invoked with the `-b` option', () => {
    describe('if no cookie data is specified', () => {
      it('should log an error', async () => {
        setupMocks({ batch: false, cookie: null })
        await subject.run()
        logger.error.should.have.been.called.with(
          'A session cookie must be specified with the --cookie option.'
        )
      })
    })

    describe('if no cookie name is specified', () => {
      it('should default the value to `session`', async () => {
        setupMocks({ batch: false, name: null })
        await subject.run()
        logger.error.should.have.been.called.with(
          'A cookie name must be specified with the --name option.'
        )
      })
    })

    describe('if no cookie signature is specified', () => {
      it('should log an error', async () => {
        setupMocks({ batch: false, signature: null })
        await subject.run()
        logger.error.should.have.been.called.with(
          'A cookie signature must be specified with the --signature option.'
        )
      })
    })

    it('should process the sample specified on the CLI', async () => {
      setupMocks({ batch: false, wordlist: '/wordlist' })
      await subject.run()
      expressSpy.makeRequest.should.have.been.called.with({
        ip: null,
        port: null,
        data: 'eyJmb28iOiJiYXIifQ==',
        sig: 'LVMVxSNPdU_G8S3mkjlShUD78s4'
      })
    })
  })

  describe('if no wordlist is specified', () => {
    it('should log an error', async () => {
      setupMocks({
        batch: false,
        cookie: 'test',
        wordlist: null
      })

      await subject.run()
      logger.error.should.have.been.called.with(
        'A wordlist must be specified with the --wordlist option.'
      )
    })
  })

  describe('if the specified wordlist does not exist', () => {
    it('should log an error', async () => {
      setupMocks({
        batch: false,
        cookie: 'test',
        wordlist: '/a_file_which_does_not_exist.fake'
      })

      await subject.run()
      logger.error.should.have.been.called.with(
        'The specified wordlist file does not exist.'
      )
    })
  })

  describe('if the output option is specified', () => {
    it('should save successful tests to the specified file', async () => {
      setupMocks({ batch: false, wordlist: '/wordlist', output: '/results.json' })
      await subject.run()
      mockFs.writeFile.should.have.been.called()
    })

    it('should log a message when output is saved', async () => {
      setupMocks({ batch: false, wordlist: '/wordlist', output: '/results.json' })
      await subject.run()
      logger.success.should.have.been.called.with('Saved results to /results.json')
    })

    it('should log an error when output fails to save', async () => {
      setupMocks({ batch: false, wordlist: '/wordlist', output: '/fail.json' })
      await subject.run()
      logger.error.should.have.been.called.with('Failed to save results')
    })
  })

  describe('when invoked with the `-e` option', () => {
    describe('if an input file is not specified', () => {
      it('should log an error', async () => {
        setupMocks({ encode: true, inputFile: null })
        await subject.run()
        logger.error.should.have.been.called.with(
          'An input file must be specified with the --input-file option.'
        )
      })
    })

    describe('if a secret key is not specified', () => {
      it('should log an error', async () => {
        setupMocks({ encode: true, secret: null })
        await subject.run()
        logger.error.should.have.been.called.with(
          'A secret key must be specified with the --secret option.'
        )
      })
    })

    describe('if no cookie name is specified', () => {
      it('should default the value to `session`', async () => {
        setupMocks({ batch: false, encode: true, name: null })
        await subject.run()
        logger.error.should.have.been.called.with(
          'A cookie name must be specified with the --name option.'
        )
      })
    })

    it('should encode the data from the input file and output the cookie and secret', async () => {
      setupMocks({
        encode: true,
        secret: 'keyboard cat',
        inputFile: '/encode_sample.json'
      })

      await subject.run()
      logger.success.should.have.been.called.with(
        'Signature Cookie: session.sig=LVMVxSNPdU_G8S3mkjlShUD78s4'
      )

      logger.success.should.have.been.called.with(
        'Data Cookie: session=eyJmb28iOiJiYXIifQ=='
      )
    })

    it('should take precedence over the `-b` option', async () => {
      setupMocks({
        batch: true,
        encode: true,
        secret: 'keyboard cat',
        inputFile: '/encode_sample.json'
      })

      await subject.run()
      expressSpy.encodeFile.should.have.been.called()
    })
  })
})
