# build-if.macro

This is a [babel macro](https://github.com/kentcdodds/babel-plugin-macros) that lets you test a predicate at build-time, leaving the unused branch out of your runtime code, and pruning away any imports that were used only by the unused branch.

For example, this:

```js
import buildIf from 'build-if.macro';
console.log(buildIf(true, () => 'hello', () => 'goodbye'));
```

Compiles to:

```js
console.log('hello');
```

You will often want to use this in conjunction with a macro like `preval` to compute the predicate:

```js
import preval from 'babel-plugin-preval/macro';
import buildIf from 'build-if.macro';

const DEBUG_MODE = preval`module.exports = Boolean(process.env.ENABLE_DEBUG)`;

function doTheWork(opt) {
  // ...
  buildIf(DEBUG_MODE, () => {
    console.log("some debugging info");
  });
  // ...
}
```

