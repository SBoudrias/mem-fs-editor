mem-fs
=============

Simple in-memory vinyl file store.


Usage
-------------

### Loading a file

You access a file using `store#get()` method. If the file is in memory, it will be used. Otherwise, we'll load the file from the file-system.

```js
var store = require('mem-fs').create();

store.get('/test/file.txt');
```

### Adding/updating a file

You update file references by using `store#add()` method. This method take a `vinyl` file object as parameter.

```js
var File = require('vinyl');
var store = require('mem-fs').create();

var coffeeFile = new File({
  cwd: '/',
  base: '/test/',
  path: '/test/file.coffee',
  contents: new Buffer('test = 123')
});

store.add(coffeeFile);
```

### Iterating over the file system

Using `store#each(cb(file, index))`, you can iterate over every file stored in the file system.
