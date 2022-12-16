# typescript-learning-path

This section is a learning path for TypeScript, so it includes all the courses that I've taken on TypeScript.

- [Course: TypeScript Fundamentals, v3](https://frontendmasters.com/courses/typescript-v3/)
- [Web App](https://www.typescript-training.com/course/fundamentals-v3)
- [Source Code](https://github.com/mike-north/ts-fundamentals-v3)
- [Course: Intermediate TypeScript](https://frontendmasters.com/courses/intermediate-typescript/)
- [Course: Production-Grade TypeScript](https://frontendmasters.com/courses/production-typescript/)

## Notes

Interfaces defines the shape of an object type. Note that a Union `string | number` is not an object type, so it cannot be used as an interface.

Interfaces supports recursive types.

It is possible to `implements` a `type` and `interface` in TypeScript, but if the type becomes a union type, it cannot be implemented. So, if you need to allow consumers of your types to augment them, you should use `interface` instead of `type`.

The `unknown` type is the type-safe counterpart of `any`. It is a top type, which means that it is a supertype of all types in TypeScript. Unlike `any`, you cannot assign `unknown` to any other type without first asserting or narrowing to a more specific type.

The `never` type represents the type of values that never occur. For example, a function that always throws an exception or one that never returns. Variables also acquire the type `never` when narrowed by any type guards that can never be true. _(I would compare it as an `assert(1===2)` check)_.

Type Guards are some expressions that perform a runtime check that guarantees the type in some scope. Type guards can be used to narrow types in the conditional branches.


