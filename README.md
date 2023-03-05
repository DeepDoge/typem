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
if ($member.is(unknownValue)) {
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

## Custom types and validators

You can create your own types or validators

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

# Inspired by

https://github.com/DeepDoge/cute-struct
