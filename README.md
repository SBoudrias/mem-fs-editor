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

### `#read(filepath, [options])`

Read a file and return its contents as a string.

You can alternatively get the raw contents buffer if you pass `options.raw = true`.

### `#readJSON(filepath)`

Read a file and parse its contents as JSON.

### `#write(filepath, contents)`

Replace the content of a file (existing or new) with a string or a buffer.

### `#delete(filepath)`

Delete a file.

### `#copy(from, to, [options])`

Copy a file from the `from` path to the `to` path.

Optionally, pass an `options.process` function (`process(contents)`) returning a string or a buffer who'll become the new file content. The process function will take a single contents argument who is the copied file contents as a `Buffer`.

### `#copyTpl(from, to, context, [settings])`

Copy the `from` file and parse its content as an underscore template where `context` is the template context.

Optionnally pass a template `settings` object.
