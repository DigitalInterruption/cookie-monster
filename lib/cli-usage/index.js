const chalk = require('chalk')
const getUsage = require('command-line-usage')
const banner = require('../banner')
const path = require('path')
const optionList = [
  {
    name: 'batch',
    alias: 'b',
    type: Boolean,
    description: 'Enable batch mode.'
  },
  {
    name: 'cookie',
    alias: 'c',
    type: String,
    description: 'The session cookie to use when not using batch mode.'
  },
  {
    name: 'encode',
    alias: 'e',
    type: Boolean,
    description: 'Enable encode mode.'
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Print this usage guide.'
  },
  {
    name: 'input-file',
    alias: 'f',
    type: String,
    typeLabel: '{underline file}',
    description: 'The JSON file with the cookie data to analyse in batch mode / the JSON data to be encoded in encode mode.'
  },
  {
    name: 'name',
    alias: 'n',
    type: String,
    defaultValue: 'session',
    description: 'The cookie name to use when not using batch mode. {bold (default: session)}'
  },
  {
    name: 'output',
    alias: 'o',
    type: String,
    typeLabel: '{underline file}',
    description: 'The file to output the results to.'
  },
  {
    name: 'port',
    alias: 'p',
    type: Number,
    defaultValue: 3000,
    description: 'The port to bind the local test server to. {bold (default: 3000)}'
  },
  {
    name: 'secret',
    alias: 'k',
    type: String,
    description: 'The secret key to use when using encode mode.'
  },
  {
    name: 'signature',
    alias: 's',
    type: String,
    description: 'The value of the session signature cookie to use when not using batch mode.'
  },
  {
    name: 'verbose',
    alias: 'v',
    type: Boolean,
    description: 'Output verbose messages on internal operations.'
  },
  {
    name: 'wordlist',
    alias: 'w',
    type: String,
    typeLabel: '{underline file}',
    description: 'The wordlist to use as a source of possible cookie secrets.',
    defaultValue: path.join(__dirname, '../../assets/secrets.lst')
  }
]

function display () {
  const sections = [
    {
      content: chalk.whiteBright(banner.large()),
      raw: true
    },
    {
      header: 'cookie-monster',
      content: 'Automates the testing of Express.js cookies for weak secrets.'
    },
    {
      header: 'Options',
      optionList: optionList
    }
  ]

  if (process.env.NODE_ENV !== 'test') {
    console.log(getUsage(sections))
  }
}

module.exports = {
  display: display,
  optionList: optionList
}
