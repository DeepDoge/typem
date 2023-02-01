# What is this?
Master Validator is a basic runtime type checker for TypeScript.
Easy to use and easy to extend.

# Installation
```bash
npm install https://github.com/DeepDoge/master-validator.git -D
```

# Usage
```ts
# Path: examples/usage.ts
```

You can use if statement to check if value is valid<br/>
if its valid typescript will infer type of value
```ts
if ($member.is(unknownValue)) 
{
    // So you can use it like this with the correct type
    unknownValue.name // string
}
else
{
    unknownValue // unknown
    unknownValue.name // Error
}
```

Or you can use parse function to throw error if value is invalid
If value is valid typescript will infer type of value
```ts
const value = $member.parse(unknownValue) // throws error if value is invalid
// Then you can use it like this with the correct type
value.name // string 
```

Or if you only wanna check if the type is valid with typescript and not check value on runtime
```ts
$member.typecheck({ ... }) // doesn't throw error, gives typescript error if type is invalid
// Or
const foo = { ... } satisfies $infer<typeof $member> // same as above
```

## Extending with custom validators
You can create your own validators
```ts
# Path: examples/custom.ts
```

# Inspired by
https://github.com/DeepDoge/cute-struct