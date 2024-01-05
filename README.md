# 🐇 Zod Env

**Functional mixin that adds "envParse" to [Zod](https://zod.dev/) for
conditionally disabling run-time parsing**

## Motivation

Primarily inspired by [Yehonathan
Sharvit](https://www.manning.com/books/data-oriented-programming)'s usage of
conditional run-time validation using [AJV](https://ajv.js.org/) as part of a
[data-oriented programming]9https://en.wikipedia.org/wiki/Data-oriented_design)
approach.

While there are several benefits to using Zod over AJV, such as the automatic
inference of types based on the created run-time schema, Zod was primarily
designed for strict type-safety, especially for usage at the edges of your data
ingress and egress. This means that Zod does not naturally lend itself to
weaker-typed TypeScript or pure JavaScript projects. 

However, due to the nature of Zod's schema inference, it is several orders of
magnitude slower than AJV and other pure validation libraries. This means that
even when using Zod in a strict type-safety manner, there might still be
performance benefits to disabling run-time validation in production.

This plugin provides the above, while still preserving Zod's type inference
functionality.

## Usage

```bash
npm install zod zod-env
```

```ts
import { z } from 'zod';
import { withEnv } from 'zod-env'

const person = withEnv(z.object({
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

The following `.ENV` variable will disable run-time checking:

```dockerfile
NODE_ENV="production"
```

All other values, for example `development`, will enable run-time checking.

You can create your own `withEnv` if for custom ENV variable logic:

```ts
import { z } from 'zod';
import { createWithEnv } from 'zod-env'

const withEnv = createWithEnv({
    MY_ENV: 'strict',
    REACT_APP_CUSTOM_ENV: /^enable-.*/i,
}, true)

const person = withEnv(z.object({
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

The `createWithEnv` constructor accepts the following arguments:

- An object of ENV variables kev-value pairs to match against in the `.ENV`
  file. Accepts both `string` and regular expressions. Note that it is
  considered a match if any of the key-value pairs are present in the `.ENV`
  file.

- An optional boolean that determines whether run-time checking should be
  enabled or disabled if a match is detected. By default this is set to `false`,
  meaning that run-time checking will disabled if a match is detected. 

For example the presence of any of the following will enable run-time checking.
All other cases will disable run-time checking.

```dockerfile
MY_ENV="strict"
```

```dockerfile
REACT_APP_CUSTOM_ENV="enabled-latest-app
```

