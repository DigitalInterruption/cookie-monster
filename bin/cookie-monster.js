#! /usr/bin/env node
const fs = require('fs')
const logger = require('../lib/logger')
const chalk = require('chalk')
const banner = require('../lib/banner')
const usage = require('../lib/cli-usage')
const express = require('../lib/express-helper')
const commandLineArgs = require('command-line-args')
const options = commandLineArgs(usage.optionList, {
  partial: true,
  camelCase: true
})

function printSmallBanner () {
  console.log(chalk.whiteBright(banner.small()))
}

function exit (error, logError = true) {
  if (process.env.NODE_ENV !== 'test') {
    if (error) {
      if (logError) {
        if (error instanceof Error) {
          logger.exception(error)
        } else {
          logger.error(error)
        }
      }

      verbose('Exiting', 'error')
      process.exit(1)
    } else {
      process.exit()
    }
  }
}

function validateOptions () {
  if (options.encode) {
    if (!options.secret) {
      logger.error('A secret key must be specified with the --secret option.')
      return false
    }
  } else {
    if (!options.wordlist) {
      logger.error('A wordlist must be specified with the --wordlist option.')
      return false
    }

    if (!fs.existsSync(options.wordlist)) {
      logger.error('The specified wordlist file does not exist.')
      return false
    }
  }

  if (options.batch || options.encode) {
    if (!options.inputFile) {
      logger.error('An input file must be specified with the --input-file option.')
      return false
    }

    if (!fs.existsSync(options.inputFile)) {
      logger.error('The specified input file does not exist.')
      return false
    }
  }

  if (!options.batch && !options.encode) {
    if (!options.cookie) {
      logger.error('A session cookie must be specified with the --cookie option.')
      return false
    }

    if (!options.signature) {
      logger.error('A cookie signature must be specified with the --signature option.')
      return false
    }
  }

  if (!options.batch && !options.name) {
    logger.error('A cookie name must be specified with the --name option.')
    return false
  }

  return true
}

function verbose (message, level = 'info') {
  if (options.verbose) {
    logger[level](message)
  }
}

function readListToArray () {
  verbose(`Loading wordlist from ${options.wordlist}`)
  return new Promise((resolve, reject) => {
    fs.readFile(options.wordlist, function (error, data) {
      if (error) {
        reject(error)
      } else {
        resolve(data
          .toString()
          .replace(/\r\n/g, '\n')
          .split('\n')
          .filter(v => v.trim() !== '')
        )
      }
    })
  })
}

function prepareCookies () {
  return new Promise((resolve, reject) => {
    if (options.batch) {
      fs.readFile(options.inputFile, function (error, data) {
        if (error) {
          reject(error)
        } else {
          resolve(JSON.parse(data.toString()))
        }
      })
    } else {
      resolve([{
        name: options.name,
        samples: [{
          ip: null,
          port: null,
          data: options.cookie,
          sig: options.signature
        }]
      }])
    }
  })
}

function saveResults (results) {
  return new Promise((resolve, reject) => {
    fs.writeFile(options.output, JSON.stringify(results, null, 4), (error) => {
      if (error) {
        logger.error('Failed to save results')
        logger.exception(error)
      } else {
        logger.success(`Saved results to ${options.output}`)
      }

      resolve()
    })
  })
}

async function decode () {
  try {
    let matches = []
    let secrets = await readListToArray()
    let cookies = await prepareCookies()

    for (let cookie of cookies) {
      let solvedSamples = []
      logger.info(`Testing samples for: ${cookie.name}`)

      for (let secret of secrets) {
        solvedSamples = []

        if (cookie.samples.length === 0) {
          verbose(`No more samples left to process for ${cookie.name}`, 'info')
          continue
        }

        verbose(`Testing ${cookie.samples.length} sample(s) for secret "${secret}"`, 'info')

        let opts = {
          cookieSecret: secret,
          cookieName: cookie.name,
          port: options.port
        }

        verbose(`Building Express server on port ${options.port}`)
        let expressInstance = express.start(opts)

        for (let sample of cookie.samples) {
          if (await express.makeRequest(sample, opts)) {
            solvedSamples.push(cookie)

            if (options.output) {
              matches.push({
                name: cookie.name,
                data: sample.data,
                sig: sample.sig,
                ip: sample.ip,
                port: sample.port,
                decodedData: Buffer.from(sample.data, 'base64').toString(),
                secret: secret
              })
            }
          }
        }

        // Remove solved samples.
        for (let sample of solvedSamples) {
          cookie.samples.splice(cookie.samples.indexOf(sample), 1)
        }

        await expressInstance.server.close()
      }
    }

    if (options.output) {
      await saveResults(matches)
    }
  } catch (error) {
    return exit(error)
  }
}

async function encode () {
  let expressInstance

  try {
    verbose(`Building Express server on port ${options.port}`)
    expressInstance = express.start({
      cookieSecret: options.secret,
      cookieName: options.name,
      port: options.port
    })

    let res = await express.encodeFile({
      inputFile: options.inputFile,
      cookieName: options.name,
      port: options.port
    })

    logger.success(`Data Cookie: ${options.name}=${res.data}`)
    logger.success(`Signature Cookie: ${options.name}.sig=${res.sig}`)
  } catch (error) {
    return exit(error)
  } finally {
    if (expressInstance) {
      await expressInstance.server.close()
    }
  }
}

async function run () {
  if (options.help) {
    usage.display()
    return
  }

  printSmallBanner()

  if (!validateOptions()) {
    return exit(1, false)
  }

  if (!options.encode) {
    await decode()
  } else {
    await encode()
  }
}

if (require.main === module) {
  run()
}

module.exports = {
  run: run
}
