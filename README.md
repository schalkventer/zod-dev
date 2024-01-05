# 🐇 Zod Dev <img align="right" src="https://m.media-amazon.com/images/W/MEDIAX_792452-T2/images/I/714Gevq7rtL.jpg" width="125">
[![](https://img.shields.io/npm/v/zod-dev)](https://www.npmjs.com/package/zod-dev) [![](https://img.shields.io/npm/dm/zod-dev.svg)](https://www.npmjs.com/package/zod-dev) ![](https://img.shields.io/github/stars/schalkventer/zod-dev?style=social) 

**Functional mixin that adds "devParse" to [Zod](https://zod.dev/) to disable run-time parsing in production**  

# Motivation

Primarily inspired by a [Yehonathan&nbsp;Sharvit](https://www.manning.com/books/data-oriented-programming)'s usage of conditional validation using [AJV](https://ajv.js.org/) as part of a
[data&#8209;oriented&nbsp;programming](https://en.wikipedia.org/wiki/Data-oriented_design)
approach.

> **Moreover, in Data-Oriented Programming, it is quite common to have some data validation parts enabled only during development and to disable them when the system runs in production.**
>
> \- [Data-oriented Programming (2022)]([https://www.manning.com/books/data-oriented-programming](https://blog.klipse.tech/javascript/2021/09/30/data-validation-with-json-schema.html))

There are several benefits to using Zod over AJV, most prominent being automatic
inference of static types from schemas. However, Zod is primarily designed for
strict Typescript type-safety, especially for usage at the edges of your
project's data ingress and egress. For this reason, Zod does not naturally lend
itself well to loosely typed TypeScript or pure JavaScript projects. 

# Usage

```bash
npm install zod zod-dev
```

Simply wrap your Zod schema with the `withDev` function, and provide a condition
that determines whether run-time parsing should be enabled. For example if you
are using [Vite]() the following should suffice:

```ts
import { z } from 'zod';
import { withDev } from 'zod-dev'

const isDev = import.meta.env.MODE !== "production"

const person = withDev(isDev, z.object({
    name: z.string(),
    email: z.string().email(),
    age: z.number().int().min(0),
}))

const value = {
    name: 'John Doe',
    email: 'john@doe.com',
    age: 24,
}

const result = person.devParse(value)
```

![image](https://github.com/schalkventer/zod-dev/assets/14258328/175e5f9d-0b5e-4804-b04e-e20bd36c04f0)

If you don't want to pass the condition directly each time, you can use the
`createWithDev` constructor to create a custom `withDev` function:

```ts
import { z } from 'zod';
import { createWithDev } from 'zod-dev'

const isDev = import.meta.env.MODE !== "production"
const withDev = createWithDev(isDev)

const person = withDev(z.object({
    name: z.string(),
    email: z.string().email(),
    age: z.number().int().min(0),
}))
```

It is recommended that you create a utility file that simply exports your custom
`withDev` function for use throughout your project.

# Performance

Due to the nature of Zod's schema inference, it is several orders
of magnitude slower than AJV at run-time parsing. This means that even when
using Zod in a strict type-safety manner, there might still be performance
benefits to disabling run-time validation in production environments.

As per [Runtype Benchmarks](https://moltar.github.io/typescript-runtime-type-benchmarks/):

![image](https://github.com/schalkventer/zod-dev/assets/14258328/490bbee0-d27c-44b1-a9d2-a151fc5aa756)
![image](https://github.com/schalkventer/zod-dev/assets/14258328/a01fa8a7-6a34-4fcc-96da-0571f18b1345)

If you're interested in the reason for the difference you can have a look at [the follow conversation](https://github.com/colinhacks/zod/issues/205).

# FAQ
