const fs = require('fs')
const path = require('path')

function large () {
  const bannerPath = path.join(__dirname, '../../assets/banner.txt')
  return fs.readFileSync(bannerPath, 'utf8')
}

function small () {
  const bannerPath = path.join(__dirname, '../../assets/banner.small.txt')
  return fs.readFileSync(bannerPath, 'utf8')
}

module.exports = {
  large: large,
  small: small
}
