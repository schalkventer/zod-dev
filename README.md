# 🐇 Zod Env <img align="right" src="https://m.media-amazon.com/images/W/MEDIAX_792452-T2/images/I/714Gevq7rtL.jpg" width="125">

**Functional mixin that adds "envParse" to [Zod](https://zod.dev/) to
dynamically disable run-time parsing**  

## Motivation

Primarily inspired by a
[Yehonathan&nbsp;Sharvit](https://www.manning.com/books/data-oriented-programming)'s
usage of conditional validation using [AJV](https://ajv.js.org/) as part of a
[data&#8209;oriented&nbsp;programming](https://en.wikipedia.org/wiki/Data-oriented_design)
approach.

There are several benefits to using Zod over AJV, most prominent being automatic
inference of static types from schemas. However, Zod is primarily designed for
strict Typescript type-safety, especially for usage at the edges of your
project's data ingress and egress. For this reason, Zod does not naturally lend
itself well to loosely typed TypeScript or pure JavaScript projects. 

Additionally, due to the nature of Zod's schema inference, it is several orders
of magnitude slower than AJV at run-time parsing. This means that even when
using Zod in a strict type-safety manner, there might still be performance
benefits to disabling run-time validation in production environments.

This plugin provides the above, while still preserving Zod's type inference
functionality.

_Note that this plugin was created as means to toggle parsing between different
environment, however since it merely accepts a boolean condition, it can be used
to toggle parsing based on any condition you need._

## Usage

```bash
npm install zod zod-env
```

Simply wrap your Zod schema with the `withEnv` function, and provide a condition
that determines whether run-time parsing should be enabled. For example if you
are using [Vite]() the following should suffice:

```ts
import { z } from 'zod';
import { withEnv } from 'zod-env'

const isDev = import.meta.env.MODE !== "production"

const person = withEnv(isDev, z.object({
    name: z.string(),
    email: z.string().email(),
    age: z.number().int().min(0),
}))

const value = {
    name: 'John Doe',
    email: 'john@doe.com',
    age: 24,
}

const result = person.envParse(value)
```

![image](https://github.com/schalkventer/zod-env/assets/14258328/175e5f9d-0b5e-4804-b04e-e20bd36c04f0)

If you don't want to pass the condition directly each time, you can use the
`createWithEnv` constructor to create a custom `withEnv` function that accepts a
condition as the first argument.

```ts
import { z } from 'zod';
import { createWithEnv } from 'zod-env'

const isDev = import.meta.env.MODE !== "production"
const withEnv = createWithEnv(isDev)

const person = withEnv(z.object({
    name: z.string(),
    email: z.string().email(),
    age: z.number().int().min(0),
}))
```

It is recommended that you create a utility file that simply exports your custom
`withEnv` function for use throughout your project.
