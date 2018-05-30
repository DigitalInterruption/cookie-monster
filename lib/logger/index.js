require('colors')

const indentString = require('indent-string')

function log (message, colour = 'white', indent = 0) {
  if (process.env.NODE_ENV !== 'test') {
    console.log(indentString(message[colour], indent))
  }
}

function info (message, indent = 0) {
  if (indent === 0) {
    log(`[*] ${message}`, 'cyan')
  } else {
    log(`- ${message}`, 'cyan', indent)
  }
}

function exception (error, indent = 0) {
  if (indent === 0) {
    log(`[!] ${error.message}: ${error.stack}`, 'red')
  } else {
    log(`- ${error.message}: ${error.stack}`, 'red', indent)
  }
}

function error (message, indent = 0) {
  if (indent === 0) {
    log(`[!] ${message}`, 'red')
  } else {
    log(`- ${message}`, 'red', indent)
  }
}

function warning (message, indent = 0) {
  if (indent === 0) {
    log(`[!] ${message}`, 'yellow')
  } else {
    log(`- ${message}`, 'yellow', indent)
  }
}

function success (message, indent = 0) {
  if (indent === 0) {
    log(`[+] ${message}`, 'green')
  } else {
    log(`- ${message}`, 'green', indent)
  }
}

module.exports = {
  log: log,
  info: info,
  error: error,
  warning: warning,
  success: success,
  exception: exception
}
