'use strict';

module.exports = function (filepath) {
  const file = this.store.get(filepath);

  return file.contents !== null;
};
