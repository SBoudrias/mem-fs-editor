# mem-fs-editor

[![Node.js CI](https://github.com/SBoudrias/mem-fs-editor/workflows/Node.js%20CI/badge.svg)](https://github.com/SBoudrias/mem-fs-editor/actions?query=workflow%3A%22Node.js+CI%22)
[![NPM version](https://badge.fury.io/js/mem-fs-editor.svg)](http://badge.fury.io/js/mem-fs-editor)
[![Coverage Status](https://codecov.io/gh/SBoudrias/mem-fs-editor/branch/master/graph/badge.svg)](https://codecov.io/gh/SBoudrias/mem-fs-editor)

File edition helpers working on top of [mem-fs](https://github.com/SBoudrias/mem-fs)

## Usage

```js
import { create as createMemFs } from 'mem-fs';
import { create as createEditor } from 'mem-fs-editor';

const store = createMemFs();
const fs = createEditor(store);

fs.write('somefile.js', 'var a = 1;');
await fs.commit()
```

### `#read(filepath, [options])`

Read a file and return its contents as a string.

You can alternatively get the raw contents buffer if you pass `options.raw = true`.

By default, calling `read()` on a file path that does not exist throws error. You can, however, pass `options.defaults = 'your default content'` to get a default content you pass in, if you prefer to not deal with try/catch.

### `#readJSON(filepath, [defaults])`

Read a file and parse its contents as JSON.

`readJSON()` internally calls `read()` but will not throw an error if the file path you pass in does not exist. If you pass in an optional `defaults`, the `defaults` content will be returned in case of the target file is missing, instead of `undefined`. (Error would still be thrown if `JSON.parse` failed to parse your target file.)

### `#write(filepath, contents)`

Replace the content of a file (existing or new) with a string or a buffer.

### `#writeJSON(filepath, contents[, replacer [, space]])`

Replace the content of a file (existing or new) with an object that is to be converted by calling `JSON.stringify()`.

`contents` should usually be a JSON object, but it can technically be anything that is acceptable by [JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify).

Optionally pass `replacer` and `space` as the last two arguments, as defined by [JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify). `spacer` is used to format the output string (prettify).

Default value for `space` is `2`, when not specified.

### `#append(filepath, contents, [options])`

Append the new contents to the current file contents.

- `options.trimEnd` (default `true`). Trim trailing whitespace of the current file contents.
- `options.separator` (default `os.EOL`). Separator to insert between current and new contents.
- `options.create` (default `false`). Create the file if doesn't exists.

### `#appendTpl(filepath, contents, context[, templateOptions[, [options]])`

Append the new `contents` to the exsting `filepath` content and parse the new contents as an [ejs](http://ejs.co/) template where `context` is the template context (the variable names available inside the template).

- `options.trimEnd` (default `true`). Trim trailing whitespace of the current file contents.
- `options.separator` (default `os.EOL`). Separator to insert between current and new contents.

### `#extendJSON(filepath, contents[, replacer [, space]])`

Extend the content of an existing JSON file with the partial objects provided as argument.

Optionally take the same JSON formatting arguments than `#writeJSON()`.

### `#delete(filepath, [options])`

Delete a file or a directory.

`filePath` can also be a `glob`. If `filePath` is glob, you can optionally pass in an `options.globOptions` object to change its pattern matching behavior. The full list of options are being described [here](https://github.com/mrmlnc/fast-glob#options-1). The `sync` flag is forced to be `true` in `globOptions`.

### `#copy(from, to, [options], context[, templateOptions ])`

Copy file(s) from the `from` path to the `to` path.
When passing array, you should pass `options.fromBasePath` to be used to calculate the `to` relative path. The common directory will be detected and used as `fromBasePath` otherwise.

Optionally, pass an `options.process` function (`process(contents)`) returning a string or a buffer who'll become the new file content. The process function will take a single contents argument who is the copied file contents as a `Buffer`.

`options.ignoreNoMatch` can be used to silence the error thrown if no files match the `from` pattern.
`options.append` can be used to append `from` contents to `to` instead of copying, when the file is already loaded in mem-fs (safe for regeneration).

`from` can be a glob pattern that'll be match against the file system. If that's the case, then `to` must be an output directory. For a globified `from`, you can optionally pass in an `options.globOptions` object to change its pattern matching behavior. The full list of options are being described [here](https://github.com/mrmlnc/fast-glob#options-1). The `nodir` flag is forced to be `true` in `globOptions` to ensure a vinyl object representing each matching directory is marked as `deleted` in the `mem-fs` store.

Optionally, when `from` is a glob pattern, pass an `options.processDestinationPath` function (`processDestinationPath(destinationFile)`) returning a string who'll become the new file name.

`options.noGlob` can be used to by bypass glob matching entirely. In that case, `from` will directly match file paths against the file system.

### `#copyAsync(from, to, [options], context[, templateOptions ])`

Async version of `copy`.

`copy` loads `from` to memory and copy its contents to `to`.
`copyAsync` copies directly from the disk to `to`, falling back to `copy` behavior if the file doesn't exists on disk.

Same parameters of `copy` (see [copy() documentation for more details](#copyfrom-to-options-context-templateoptions-)).

### `#copyTpl(from, to, context[, templateOptions [, copyOptions]])`

Copy the `from` file and, if it is not a binary file, parse its content as an [ejs](http://ejs.co/) template where `context` is the template context (the variable names available inside the template).

You can optionally pass a `templateOptions` object. `mem-fs-editor` automatically setup the filename option so you can easily use partials.

You can also optionally pass a `copyOptions` object (see [copy() documentation for more details](#copyfrom-to-options-context-templateoptions-)).

Templates syntax looks like this:

```
<%= value %>
<%- include('partial.ejs', { name: 'Simon' }) %>
```

Dir syntax looks like this:

```
/some/path/dir<%= value %>/...
```

Refer to the [ejs documentation](http://ejs.co/) for more details.

### `#copyTplAsync(from, to, [options], context[, templateOptions ])`

Async version of `copyTpl` that uses `copyAsync` instead of `copy`.

Can be used for best performance. Reduces overheads.

Same parameters of `copyTpl` (see [copyTpl() documentation for more details](#copyfrom-to-options-context-templateoptions-)).

### `#move(from, to, [options])`

Move/rename a file from the `from` path to the `to` path.

`#move` internally uses `#copy` and `#delete`, so `from` can be a glob pattern, and you can provide `options.globOptions` with it.

### `#exists(filepath)`

Returns `true` if a file exists. Returns `false` if the file is not found or deleted.

### `#commit([options,] [...transforms])`

Pass stored files through a pipeline and persist every changes made to files in the mem-fs store to disk.

If provided, `options` is the pipeline options.
By default only modified files are passed through the pipeline.
Pass a custom filter `options.filter` to customize files passed through the pipeline.
If provided, `...transforms` is a vararg of TransformStream to be applied on a stream of vinyl files (like gulp plugins).
`commitTransform` is appended to `transforms` and persists modified files to disk, non modified files are passed through.

returns promise that is resolved once the pipeline is finished.

### `#dump([cwd,] [filter])`

Dump files to compare expected result.
Provide a `cwd` for relative path. Allows to omit temporary path.
Provide a `filter` function or a pattern to focus on specific files.
`dump` returns only modified (committed or not) files when no filter or a pattern is provided.
