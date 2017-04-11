const lodash = require('lodash');
const errorHandler = require('../../');
const debug = require('debug')('kubide:errorhandler:parser:mongoose');


errorHandler.addParser((err) => {
  if (!(err instanceof Error)) {
    return err;
  }

  debug("aaa", err);

  return err;
});
