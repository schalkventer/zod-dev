<!-- omit in toc -->
# 🦞 Zod Dev
[![](https://img.shields.io/npm/v/zod-dev)](https://www.npmjs.com/package/zod-dev)
[![](https://img.shields.io/github/stars/schalkventer/zod-dev?style=social)](https://github.com/schalkventer/zod-dev)

**Conditionally disables [Zod](https://zod.dev/) run-time parsing in production
while preserving type inference.**  

- [Motivation](#motivation)
- [Basic Usage](#basic-usage)
- [Constructors](#constructors)
- [CRUD Operations](#crud-operations)
- [Performance](#performance)
- [FAQ](#faq)

_⭐ If you find this tool useful please consider giving it a star on Github ⭐_

# Motivation

Primarily inspired by
[Yehonathan&nbsp;Sharvit](https://www.manning.com/books/data-oriented-programming)'s
use of conditional validation with [AJV](https://ajv.js.org/) as part of a
[data&#8209;oriented&nbsp;programming](https://en.wikipedia.org/wiki/Data-oriented_design)
approach.

>**Moreover, in Data-Oriented Programming, it is quite common to have some data
> validation parts enabled only during development and to disable them when the
> system runs in production.**
>
> — _[Data-oriented Programming
> (2022)]([https://www.manning.com/books/data-oriented-programming](https://blog.klipse.tech/javascript/2021/09/30/data-validation-with-json-schema.html))_

**There are several benefits to using [Zod](https://zod.dev/) over AJV, the most
prominent being the automatic inference of static types from schemas.**

However, [Zod](https://zod.dev/) is primarily designed for strict type safety,
especially for use with TypeScript at the edges of your project's data ingress
and egress. For this reason, [Zod](https://zod.dev/) does not naturally lend
itself well to pure JavaScript projects, usage of JSDoc and/or more loosely
typed TypeScript projects by means of `// @ts-check`.

# Basic Usage

```bash
npm install zod zod-dev
```

Simply wrap your [Zod](https://zod.dev/) schema with the `withDev` functional
mixin and provide a condition that determines whether run-time parsing should be
enabled. For example, if you are using [Vite](https://vitejs.dev/), the
following should suffice:

```ts
import { z } from 'zod';
import { withDev } from 'zod-dev'

const isDev = import.meta.env.MODE !== "production"

const schema = withDev(isDev, z.object({
    name: z.string(),
    email: z.string().email(),
    age: z.number().int().min(0),
}))

const value = {
    name: 'John Smith',
    email: 'john@smith.com',
    age: 24,
}

const result = schema.devParse(value)
```

![image](https://github.com/schalkventer/zod-dev/assets/14258328/175e5f9d-0b5e-4804-b04e-e20bd36c04f0)

Note that `withDev` leaves the original schema untouched, so you can still, for
example, use `person.parse(value)` or `person.shape.email` should you wish.

# Constructors

If you don't want to pass the condition manually each time you can use one of
the following factory functions that implicitly include the condition. This
means that you don't need to manually pass the condition each time you create a
schema. Both serve the same purpose, and are simply a matter of preference.

The first, `createWithDev` create a custom `withDev` that automatically includes
the condition:

```ts
import { z } from 'zod';
import { createWithDev } from 'zod-dev'

const isDev = import.meta.env.MODE !== "production"
const withDev = createWithDev(isDev)

const schema = withDev(isDev, z.object({
    name: z.string(),
    email: z.string().email(),
    age: z.number().int().min(0),
}))

const value = {
    name: 'John Smith',
    email: 'john@smith.com',
    age: 24,
}

const result = schema.devParse(value)
```

The second, `createDevParse`, creates devParse as a stand-alone function that
accepts any value and schema. This provides a bit more flexibility since it is
not bound to a specific schema:

```ts
import { z } from 'zod';
import { createDevParse } from 'zod-dev'

const isDev = import.meta.env.MODE !== "production"
const devParse = createDevParse(isDev)

const schema = z.object({
    name: z.string(),
    email: z.string().email(),
    age: z.number().int().min(0),
})

const value = {
    name: 'John Smith',
    email: 'john@smith.com',
    age: 24,
}

const result = devParse(value, schema)
```

# CRUD Operations

Due to the ubiquity of immutable helper functions as a means to manipulate data
in Data-oriente Programming, `zod-dev` also provides the means to create a basic
CRUD helper functions as a means to manipulate objects that share the same
schema in an array list. 

This is done by making use of `createArrayOperations` which accepts a schema and
returns an object as follows:

**All helpers automatically run `devParse` on all inputs and outputs
to ensure data integrity.**

```js
import { z } from "zod";
import { withDev, createArrayOperations } from "zod-dev";
const isDev = import.meta.env.MODE !== "production";

const schema = z.object({
    name: z.string(),
    email: z.string().email(),
    age: z.number().int().min(0),
})

export const { isCollection, getIndices, get, add, update, remove } = createArrayOperations(
  isDev,
  schema
);

let data = isCollection([
    {
        id: '4a932261-93dc-448a-91e5-bf3541510cfa',
        name: 'John Smith',
        email: 'john@smith.com',
        age: 24,
    },
    {
        id: '61627dac-2cb5-4934-a9bb-c2075e932ce8',
        name: 'Lorem Ipsum ',
        email: 'lorem@ipsum.com',
        age: 39,
    }
])

console.log(getIndices(data, '61627dac-2cb5-4934-a9bb-c2075e932ce8')) // [1]
console.log(getIndices(data, (item) => item.email.includes('@'))) // [0, 1]

// `get` works exactly like `getIndices` but returns the actual items instead
console.log(get(data, ['4a932261-93dc-448a-91e5-bf3541510cfa']))
console.log(get(data, (item) => item.email.includes('@')))

data = remove(data, '61627dac-2cb5-4934-a9bb-c2075e932ce8')
data = remove(data, (item) => item.name === 'John Smith')

// data is now `[]`

data = add(
    data, 
    {
        id: '61627dac-2cb5-4934-a9bb-c2075e932ce8',
        name: 'Lorem Ipsum ',
        email: 'lorem@ipsum.com',
        age: 39,
    }
)

data = add(
    data, 
    {
        id: '4a932261-93dc-448a-91e5-bf3541510cfa',
        name: 'John Smith',
        email: 'john@smith.com',
        age: 24,
    },
    'start'
)

// data is now same when created

data = update(data, (item) => ({ ...item, age: item.age + 1 })) 
// Ages are now `25` and `40`

data = update(data, (item) => ({ ...item, name: item.name.toReversed() }), '4a932261-93dc-448a-91e5-bf3541510cfa')
// `John Smith` name is now `htimS nhoJ`
```

# Performance

Due to the nature of [Zod](https://zod.dev/)'s schema inference, it is several
orders of magnitude slower than [AJV](https://ajv.js.org/) for run-time parsing.
This means that even when using [Zod](https://zod.dev/) in a strict type-safety
manner, there might still be performance benefits to disabling run-time
validation in production environments.

As per
[Runtype&nbsp;Benchmarks](https://moltar.github.io/typescript-runtime-type-benchmarks/):

![image](https://github.com/schalkventer/zod-dev/assets/14258328/81adc3e3-a3f2-41fa-bdd1-1da943e27f6f)

If you're interested in the reason for the difference you can have a look at
[the follow conversation](https://github.com/colinhacks/zod/issues/205).

# FAQ

**What value should I use to toggle run-time checking?**

This plugin was created for the use case of toggling run-time checking between
different environments. However, since it merely accepts a boolean condition,
parsing can effectively be toggled based on anything that can be expressed as
true or false in JavaScript.

**Should I use conditional run-time checking everywhere?**

No. It is recommended that you still use `.parse` and/or `.safeParse` as
intended when validating external consumed by you app. For example during form
submissions or JSON data from an REST endpoint. 

