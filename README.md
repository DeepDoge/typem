# What is this?
Master Validator is a basic runtime type checker for TypeScript.
Easy to use and easy to extend.

# Installation
```bash
npm install https://github.com/DeepDoge/master-validator.git -D
```

# Usage
```ts
const $person = $object({
    name: $lengthRange($string(), 1, 32),
    age: $union($null(), $gt($number(), 0)),
    sex: $union($literal('man'), $literal('woman')),
    // or you can use `oneOf` instead of `union` and `literal`
    city: $optional($enum(
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

const $memberRole = $enum('admin', 'moderator', 'user')
const $member = $intersection($person, $object({
    id: $length($string(), 32),
    role: $memberRole
}))
```
Type of $member:
```ts
{
    name: string
    age: number | null
    sex: 'male' | 'female'
    city?: 'Kraków' | 'Oaxaca' | 'Moscow' | 'Kabul' | 'Baghdad' | 'Kuala, Lumpur' | 
    'Jeddah' | 'Riyadh' | 'Mogadishu' | 'Dubai' | 'Abu Dhabi' | 'Sanaa' | 'Ibadan' | 
    'Taizz' | 'Tehran' | null | undefined
    id: string
    role: 'admin' | 'moderator' | 'user'
}
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

Or you can use parse function to throw error if value is invalid<br/>
If value is valid typescript will infer type of value
```ts
const value = $member.parse(unknownValue) // throws error if value is invalid
// Then you can use it like this with the correct type
value.name // string 
```

Or if you only wanna check if the type is valid with typescript and not check value on runtime
```ts
$member.type({ ... }) // doesn't throw error, gives typescript error if type is invalid
```

## Extending with custom validators
You can create your own validators
```ts
import { $bigint, $number, $validator, Validator } from "../library"

class MyClass {}
const $myClass = $validator((value: unknown): asserts value is MyClass => {
    if (!(value instanceof MyClass)) throw new Error('Not a MyClass')
})

const $positiveNumber = $validator((value: unknown): asserts value is number => {
    if (typeof value !== 'number') throw new Error('Not a number')
    if (value <= 0) throw new Error('Not a positive number')
})

// Or you can inhrerit from another validator
const $positive = $validator(<T extends bigint | number>(value: unknown, validator: Validator<T>): asserts value is T => {
    validator.assert(value)
    if (value <= 0) throw new Error('Not a positive number')
}) 

const $positiveBigInt = $positive($bigint())
const $positiveNumber = $positive($number())
```

# Inspired by
https://github.com/DeepDoge/cute-struct