# What is this?
Master Validator is a basic runtime type checker for TypeScript.
Easy to use and easy to extend.

# Installation
```bash
npm install https://github.com/DeepDoge/master-validator.git -D
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
/* 
    Type of member:
    {
        name: string
        age: number | null
        sex: 'man' | 'woman'
        city: 'Kraków' | 'Oaxaca' | 'Moscow' | 'Kabul' | 'Baghdad' | 
                'Kuala, Lumpur' | 'Jeddah' | 'Riyadh' | 'Mogadishu' | 'Dubai' | 
                'Abu Dhabi' | 'Sanaa' | 'Ibadan' | 'Taizz' | 'Tehran' | null
        id: string
        role: 'admin' | 'moderator' | 'user'
    }
*/

```

You can use if statement to check if value is valid<br/>
if its valid typescript will infer type of value
```ts
if (member.is(unknownValue)) 
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
const value = member.parse(unknownValue) // throws error if value is invalid
// Then you can use it like this with the correct type
value.name // string 
```

## Extending with custom validators
You can create your own validators
```ts
const even = <T extends ms.Validator<number>>(validator: T) => ms.createValidator<ms.infer<T>>((value: unknown) =>
{
    validator(value)
    if (value % 2 !== 0) throw new TypeError(`Expected even number, got ${value}`)
})
const evenNumber = even(ms.number)

class MyClass {}
const myClass = ms.createValidator<MyClass>((value: unknown) => 
{
    if (!(value instanceof MyClass)) throw new TypeError(`Expected MyClass, got ${value}`)
})

const email = <T extends ms.Validator<string>>(validator: T) => ms.createValidator<`${string[0]}${string}@${string[0]}${string}.${string[0]}${string}`>((value: unknown) =>
{
    validator(value)
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) throw new TypeError(`Expected email, got ${value}`)
})

// then you can use it like this
const shortEmail = email(ms.maxLength(ms.string, 50))
const test = "foo@bar.baz" satisfies ms.infer<typeof shortEmail> 
```

# Inspired by
https://github.com/DeepDoge/cute-struct