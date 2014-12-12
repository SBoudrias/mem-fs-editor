'use strict';

module.exports = function (path) {
	var file = this.store.get(path);

	console.log( file.state );

	return file.contents !== null && file.state !== 'deleted';
};