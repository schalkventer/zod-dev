<!-- omit in toc -->
# 🦞 Zod Dev
[![](https://img.shields.io/npm/v/zod-dev)](https://www.npmjs.com/package/zod-dev)
[![](https://img.shields.io/npm/dm/zod-dev.svg)](https://www.npmjs.com/package/zod-dev)
[![](https://img.shields.io/github/stars/schalkventer/zod-dev?style=social)](https://github.com/schalkventer/zod-dev)

**A tiny abstract that conditionally disables [Zod](https://zod.dev/) run-time
parsing while preserving type inference.**  

- [Motivation](#motivation)
- [Basic Usage](#basic-usage)
- [Factory Functions](#factory-functions)
- [Performance](#performance)
- [FAQ](#faq)

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

However, [Zod](https://zod.dev/) is primarily designed for strict TypeScript
type safety, especially for use at the edges of your project's data ingress and
egress. For this reason, [Zod](https://zod.dev/) does not naturally lend itself
well to loosely typed TypeScript or pure JavaScript projects.

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
    name: 'John Doe',
    email: 'john@doe.com',
    age: 24,
}

const result = schema.devParse(value)
```

![image](https://github.com/schalkventer/zod-dev/assets/14258328/175e5f9d-0b5e-4804-b04e-e20bd36c04f0)

Note that `withDev` leaves the original schema untouched, so you can still, for
example, use `person.parse(value)` or `person.shape.email` should you wish.

# Factory Functions

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
    name: 'John Doe',
    email: 'john@doe.com',
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
    name: 'John Doe',
    email: 'john@doe.com',
    age: 24,
}

const result = devParse(value, schema)
```

# Performance

Due to the nature of [Zod](https://zod.dev/)'s schema inference, it is several
orders of magnitude slower than [AJV](https://ajv.js.org/) for run-time parsing.
This means that even when using [Zod](https://zod.dev/) in a strict type-safety
manner, there might still be performance benefits to disabling run-time
validation in production environments.

As per
[Runtype&nbsp;Benchmarks](https://moltar.github.io/typescript-runtime-type-benchmarks/):

![image](https://github.com/schalkventer/zod-dev/assets/14258328/490bbee0-d27c-44b1-a9d2-a151fc5aa756)
![image](https://github.com/schalkventer/zod-dev/assets/14258328/a01fa8a7-6a34-4fcc-96da-0571f18b1345)

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

