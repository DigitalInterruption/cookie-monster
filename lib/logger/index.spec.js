const rewire = require('rewire')

describe('lib/logger', function () {
  let logger = rewire('./index')
  let log = () => logger.__get__('log')
  let revert

  beforeEach(function () {
    revert = logger.__set__({
      log: chai.spy()
    })
  })

  afterEach(function () {
    revert()
  })

  describe('#info', function () {
    it('should log unindented messages with an asterisk prefix', function () {
      logger.info('test')
      log().should.have.been.called.with('[*] test')
    })

    it('should log messages in cyan', function () {
      logger.info('test')
      log().should.have.been.called.with('[*] test', 'cyan')
    })

    it('should log indented messages with a hyphen prefix', function () {
      logger.info('test', 4)
      log().should.have.been.called.with('- test')
    })
  })

  describe('#error', function () {
    it('should log unindented messages with an exclamation mark prefix', function () {
      logger.error('test')
      log().should.have.been.called.with('[!] test')
    })

    it('should log messages in red', function () {
      logger.error('test')
      log().should.have.been.called.with('[!] test', 'red')
    })

    it('should log indented messages with a hyphen prefix', function () {
      logger.error('test', 4)
      log().should.have.been.called.with('- test')
    })
  })

  describe('#warning', function () {
    it('should log unindented messages with an exclamation mark prefix', function () {
      logger.warning('test')
      log().should.have.been.called.with('[!] test')
    })

    it('should log messages in yellow', function () {
      logger.warning('test')
      log().should.have.been.called.with('[!] test', 'yellow')
    })

    it('should log indented messages with a hyphen prefix', function () {
      logger.warning('test', 4)
      log().should.have.been.called.with('- test')
    })
  })

  describe('#success', function () {
    it('should log unindented messages with a plus prefix', function () {
      logger.success('test')
      log().should.have.been.called.with('[+] test')
    })

    it('should log messages in green', function () {
      logger.success('test')
      log().should.have.been.called.with('[+] test', 'green')
    })

    it('should log indented messages with a hyphen prefix', function () {
      logger.success('test', 4)
      log().should.have.been.called.with('- test')
    })
  })

  describe('#exception', function () {
    it('should log unindented messages with an exclamation mark prefix', function () {
      let error = new Error('test')
      logger.exception(error)
      log().should.have.been.called.with(`[!] ${error.message}: ${error.stack}`)
    })

    it('should log messages in red', function () {
      let error = new Error('test')
      logger.exception(error)
      log().should.have.been.called.with(`[!] ${error.message}: ${error.stack}`, 'red')
    })

    it('should log indented messages with a hyphen prefix', function () {
      let error = new Error('test')
      logger.exception(error, 4)
      log().should.have.been.called.with(`- ${error.message}: ${error.stack}`)
    })
  })
})
