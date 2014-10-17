mem-fs-editor
=============

File edition helpers working on top of [mem-fs](https://github.com/SBoudrias/mem-fs)

Usage
-------------

```js
var memFs = require('mem-fs');
var editor = require('mem-fs-editor');

var store = memFs.create();
var fs = editor.create(store);

fs.write('somefile.js', 'var a = 1;');
```

### `#read(filepath)`

Read a file and return its contents as a string.

### `#readJSON(filepath)`

Read a file and parse its contents as JSON.

### `#write(filepath, contents)`

Write to an existing file or a new file.

### `#delete(filepath)`

Delete a file

### `#copy(from, to, [options])`

Copy a file from the `from` path to the `to` path.

Optionnaly, pass an `options.process` function (`process(contents)`) returning a string who'll become the new file content.

### `#copyTpl(from, to, context, [settings])`

Copy the `from` file and parse its content as an underscore template where `context` is the template context.

Optionnally pass a template `settings` object.
