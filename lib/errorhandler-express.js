const lodash = require('lodash');
const globalConfig = require('./errorhandler-express.conf.json');
const debug = require('debug')('kubide:errorhandler');

// TODO: Think about DEFAULT VALUES??

class ErrorHandler {
  constructor() {
    this.conf = globalConfig;
    this.parsers = [];
    this.environment = process.env.NODE_ENV || 'development';
    debug(this.environment);
  }

  addParser(parserFunction) {
    if (typeof parserFunction === 'function') {
      this.parsers.unshift(parserFunction);
    }
  }

  errorParser(err) {
    const parsedError = err;
    return parsedError;
  }


  translator(text) { return text; }

  setTranslator(translator = null) {
    if (typeof translator === 'function') {
      this.translator = translator;
    }
  }

  setConfig(externalConfig = {}) {
    this.conf = lodash.merge(externalConfig, this.conf);
    return this.conf;
  }

  handler(externalConfig = false) {
    if (externalConfig) {
      this.setConfig(externalConfig);
    }

    return (err, req, res, next) => {
      let parsedError = err;

      this.parsers.forEach((parser) => {
        parsedError = parser(parsedError, this.conf);
      });

      // only if we're parsed the error
      if (parsedError !== err) {
        if (parsedError.message) {
          parsedError.message = this.translator(parsedError.message);
        }
        if (parsedError.detail) {
          parsedError.detail = this.translator(parsedError.detail);
        }

        if (this.environment === 'production') {
          delete parsedError.stack;
        }

        res
          .status(parsedError.status)
          .json(parsedError);
      } else {
        next(err);
      }
    };
  }

}


module.exports = new ErrorHandler();
