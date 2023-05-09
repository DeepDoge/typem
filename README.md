# Master-TS Types

An easy to use and extend runtime type checker for TypeScript.

# Installation

[Install Instructions](https://github.com/DeepDoge/master-ts-types/releases)

# Usage

```ts
const $person = $object({
    name: $string($lengthRange(1, 32)),
    age: $union($null(), $number($gt(18))),
    sex: $union($literal("man"), $literal("woman")),
    city: $optional(
        $enum(
            "Kraków",
            "Oaxaca",
            "Moscow",
            "Kabul",
            "Baghdad",
            "Kuala, Lumpur",
            "Jeddah",
            "Riyadh",
            "Mogadishu",
            "Dubai",
            "Abu Dhabi",
            "Sanaa",
            "Ibadan",
            "Taizz",
            "Tehran"
        )
    ),
})

const $memberRole = $enum("admin", "moderator", "user")
const $member = $intersection(
    $person,
    $object({
        id: $string($length(32)),
        role: $memberRole,
    })
)
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
if ($member.validate(unknownValue)) {
    // So you can use it like this with the correct type
    unknownValue.name // string
} else {
    unknownValue // unknown
    unknownValue.name // Error
}
```

Or you can use parse function to throw error if value is invalid<br/>
If value is valid typescript will infer type of value

```ts
const value = $member.assert(unknownValue) // throws error if value is invalid
// Then you can use it like this with the correct type
value.name // string
```

Also, you can use `$infer` type to get the type of a `Type`
```ts
type TypeOfMember = $infer<typeof $member>
```

## Creating Types and Validators

You can create your own Types or Validators

```ts
class MyClass {}
const $myClass = $type<MyClass>((value: unknown) => {
    if (!(value instanceof MyClass)) throw new Error("Not a MyClass")
})

// $postive validator can only be used with bigint and number types
const $positive = $validator(<T extends bigint | number>(value: T) => {
    if (value < 0) throw new Error("Not a positive number")
})

const $positiveBigInt = $bigint($positive())
const $positiveNumber = $number($positive())
```

If you have a complex type, you can use `$complexType` instead of `$type`<br/>
Complex types are also used internally to create `$map`, `$union`, `$exclude` and etc.

```ts
type Complex = { a: number; b: bigint }
type TypeComplex<T extends Complex> = Type<T[keyof T]> & {
    complex: T
}
const $complex = $complexType(<T extends Complex>(self: TypeComplex<T>, complex: T) => {
    self.complex = complex
    return (value: unknown) => {
        if (
            !(
                typeof value === "object" &&
                value !== null &&
                "a" in value &&
                "b" in value &&
                typeof value.a === "number" &&
                typeof value.b === "bigint"
            )
        )
            throw new TypeError("Not a valid complex type")
    }
})

const myComplex = $complex({ a: 1, b: 2n }) // TypeComplex<{ a: number, b: bigint }>
myComplex.complex.a // type = 1
console.log(myComplex.complex.a) // 1

const unknownType = myComplex as Type<unknown>
if (unknownType.instanceOf($complex)) {
    unknownType.complex.a // type = number
    console.log(unknownType.complex.a) // 1
}
```

# Inspired by

https://github.com/DeepDoge/cute-struct
