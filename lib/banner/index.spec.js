const rewire = require('rewire')
const subject = rewire('./index')
const path = require('path')

describe('lib/banner', () => {
  let revertMocks, fs

  beforeEach('setup mocks', () => {
    fs = chai.spy.interface({
      readFileSync: () => 'banner'
    })

    revertMocks = subject.__set__({ fs: fs })
  })

  afterEach('revert mocks', () => {
    revertMocks()
  })

  describe('#small', () => {
    it('should return the content of the banner.small.txt file', () => {
      let bannerPath = path.join(__dirname, '../../assets/banner.small.txt')
      subject.small().should.eql('banner')
      fs.readFileSync.should.have.been.called.with(bannerPath, 'utf8')
    })
  })

  describe('#large', () => {
    it('should return the content of the banner.txt file', () => {
      let bannerPath = path.join(__dirname, '../../assets/banner.txt')
      subject.large().should.eql('banner')
      fs.readFileSync.should.have.been.called.with(bannerPath, 'utf8')
    })
  })
})
