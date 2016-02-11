var through = require('through2')
var tapout = require('tap-out')
var duplexer = require('duplexer')
var symbols = require('figures')
var chalk = require('chalk')

var s = {
  err: chalk.red,
  mute: chalk.reset,
  ok: chalk.green,
  heading: chalk.underline,
  raw: chalk.gray,
  trace: chalk.gray
}

function tapSpec (options) {
  if (!options) options = {}
  var out = through()
  var tap = tapout()
  var stream = duplexer(tap, out)

  if (!options.min) {
    tap.on('test', function (t) {
      out.push('\n' + '  ' + s.heading(t.name) + '\n')
    })
  }

  tap.on('fail', function (t) {
    tapSpec.failed = true
  })

  tap.on('comment', function (t) {
    out.push('  ' + s.raw(t.raw) + '\n')
  })

  if (!options.min) {
    tap.on('fail', function (t) {
      out.push('  ' + s.err(symbols.cross) + ' ' + t.name + '\n')
    })

    tap.on('pass', function (t) {
      out.push('  ' + s.ok(symbols.tick) + ' ' + s.mute(t.name) + '\n')
    })
  }

  tap.on('output', function (results) {
    if (results.plans.length < 1) {
      tapSpec.failed = true
    }

    if (results.fail.length > 0) {
      tapSpec.failed = true
    }

    if (!options.min) out.push('\n')

    if (results.fail.length > 0) {
      if (!options.min) {
        out.push('  ' + symbols.line + symbols.line + '\n')
      }

      results.fail.forEach(function (t) {
        out.push('\n  ' + s.err(symbols.cross) + ' ' + s.err(t.name) + '\n')
        out.push(formatErr(t.error))
      })

      out.push('\n')

      out.push('  ' +
        s.err(symbols.warning) + ' ' +
        s.err(results.fail.length + ' failed') + ' ' +
        results.pass.length + ' passed' +
        '\n')
    } else {
      out.push('  ' + s.ok(results.pass.length + ' passed') + '\n')
    }
  })

  return stream
}

function formatErr (err) {
  var out = ''
  out += '    ' +
    s.trace(relative(err.at.file) +
    ':' + err.at.line +
    ':' + err.at.character + ':')

  if (err.operator === 'equal' || err.operator === 'deepEqual') {
    out += ' expected ' + err.actual + ' == ' + err.expected + '\n'
  } else if (err.operator !== 'count') {
    out += ' t.' + err.operator + '()\n'
  }
  if (err.stack) {
    // TODO: clean stack trace
    out += '    ' + s.trace(err.stack.replace(/\n/g, '\n      '))
  }

  return out
}

function relative (path) {
  return path.replace(process.cwd() + require('path').sep, '')
}

module.exports = tapSpec
