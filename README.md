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
    // So you can use it like this
    unknownValue.name // string
}
```

Or you can use parse function to throw error if value is invalid
```ts
const value = ms.parseUnknown(member, unknownValue) // throws error if value is invalid
// If value is valid typescript will infer type of value
// Then you can use it like this
value.name // string 
```

# Inspired by
https://github.com/DeepDoge/cute-struct