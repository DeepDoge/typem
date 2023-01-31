# What is this?
Master Validator is a basic runtime type checker for TypeScript.
Easy to use and easy to extend.

# Installation
```bash
npm install https://github.com/DeepDoge/master-validator.git
```

# Usage
```ts
import { ms } from 'master-validator/library';
const { string, number, nullable, object, min, oneOf, union, literal, rangeLength, intersection } = ms

const person = object({
    name: rangeLength(string, 1, 32),
    age: nullable(min(number, 0)),
    sex: union(literal('man'), literal('woman')),
    // or you can use `oneOf` instead of `union` and `literal`
    city: nullable(oneOf(
        'Kraków', 
        'Oaxaca', 
        'Moscow', 
        'Kabul', 
        'Baghdad', 
        'Kuala, Lumpur', 
        'Jeddah', 
        'Riyadh', 
        'Mogadishu', 
        'Dubai', 
        'Abu Dhabi', 
        'Sanaa', 
        'Ibadan', 
        'Taizz', 
        'Tehran'
    )) 
})

const memberRole = oneOf('admin', 'moderator', 'user')
const member = intersection(person, object({
    id: string,
    role: memberRole
}))
```

You can use if statement to check if value is valid<br/>
if its valid typescript will infer type of value
```ts
if (member(unknownValue)) 
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
const value = ms.parseUnknown(member, unknownValue) // throws error if value is invalid
// Then you can use it like this with the correct type
value.name // string 
```

## Extending with custom validators
You can create your own validators
```ts
const even = <T extends ms.Validator<number>>(validator: T) =>
        ms.createValidator(
            (value: unknown): value is ms.TypeOfValidator<T> => validator(value) && value % 2 === 0,
            (value: unknown) => `Expected ${value} to be even`
        )
const evenNumber = even(ms.number)
// Or 
const evenNumber = ms.createValidator(
    (value: unknown): value is number => typeof value === 'number' && value % 2 === 0,
    (value: unknown) => `Expected ${value} to be even number`
)

class MyClass { }
const myClass = ms.createValidator(
    (value: unknown): value is MyClass => value instanceof MyClass,
    (value: unknown) => `Expected ${value} to be instance of MyClass`
)
```

# Inspired by
https://github.com/DeepDoge/cute-struct