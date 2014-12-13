mem-fs-editor [![Build Status](https://travis-ci.org/SBoudrias/mem-fs-editor.svg?branch=master)](https://travis-ci.org/SBoudrias/mem-fs-editor)
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

### `#writeJSON(filepath, contents[, replacer [, space]])`

Replace the content of a file (existing or new) with an object that is to be converted by calling `JSON.stringify()`.

`contents` should usually be a JSON object, but it can technically be anything that is acceptable by [JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify).

Optionally pass `replacer` and `space` as the last two arguments, as defined by [JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify). `spacer` is used to format the output string (prettify).

Default value for `space` is `2`, when not specified.

### `#delete(filepath)`

Delete a file or a directory.

### `#copy(from, to, [options])`

Copy a file from the `from` path to the `to` path.

Optionally, pass an `options.process` function (`process(contents)`) returning a string or a buffer who'll become the new file content. The process function will take a single contents argument who is the copied file contents as a `Buffer`.

`from` can be a glob pattern that'll be match against the file system. If that's the case, then `to` must be an output directory.

### `#copyTpl(from, to, context, [settings])`

Copy the `from` file and parse its content as an underscore template where `context` is the template context.

Optionnally pass a template `settings` object.

### `#exists(filepath)`

Returns `true` if a file exists. Returns `false` if the file is not found or deleted.

### `#commit([filters,] callback)`

Persist every changes made to files in the mem-fs store to disk.

If provided, `filters` is an array of TransformStream to be applied on a stream of vinyl files (like gulp plugins).

`callback` is called once the files are updated on disk.
