'use strict';

const DEFAULT_INDENTATION = 2;

module.exports = function (filepath, contents, replacer, space) {
  const jsonStr =
    JSON.stringify(contents, replacer || null, space || DEFAULT_INDENTATION) + '\n';

  return this.write(filepath, jsonStr);
};
