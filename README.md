# Typem

An easy to use and extend runtime type checker for TypeScript, with support for type metadata.

Checkout the source code yourself, it's just one file.

# Installation

[Install Instructions](https://github.com/DeepDoge/typem/releases)

# Usage

```ts
const t_person = t(t_object, {
	name: t(t_string).t(t_minLength, 1).t(t_maxLength, 32),
	age: t(t_union, [t(t_number).t(t_gt, 16), t(t_null)]),
	sex: t(t_union, [t(t_literal, "man"), t(t_literal, "woman")]),
	city: t(t_union, [
		t(t_undefined),
		t(t_oneOf, [
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
			"Tehran",
		]),
	]),
})

const t_memberRole = t(t_oneOf, ["admin", "moderator", "user"])
const t_member = t(t_intersection, [
	t_person,
	t(t_object, {
		id: t(t_string),
		role: t_memberRole,
	}),
])
```

You can use `Typem.Infer<typeof t_member>` to get type of it.

```ts
type Member = Typem.InferType<typeof t_member>
```

The returned type fill look like this:

```ts
{
    id: string
    name: string
    age: number | null
    sex: 'male' | 'female'
    city?: 'Kraków' | 'Oaxaca' | 'Moscow' | 'Kabul' | 'Baghdad' | 'Kuala, Lumpur' |
    'Jeddah' | 'Riyadh' | 'Mogadishu' | 'Dubai' | 'Abu Dhabi' | 'Sanaa' | 'Ibadan' |
    'Taizz' | 'Tehran' | undefined
    role: 'admin' | 'moderator' | 'user'
}
```

You can validate a value like above, by using `returnOrThrow()` function

```ts
const value = t_member.returnOrThrow(unknownValue) // throws error if value is invalid
// Then you can use it like this with the correct type
value.name // string
```

## Creating Types

You can create your own `Type`s

```ts
function t_myClass(value: unknown): MyClass {
	if (!(value instanceof MyClass)) throw new Error("Not a MyClass")
	return value
}
```

You can also chain types together

```ts
// This will both can be chained after a type that returns `bigint`` or `number``
function t_positive<T extends bigint | number>(value: T): T {
	if (value < 0) throw new Error("Not a positive number")
	return value
}

const t_positiveBigInt = t(t_bigint).t(t_positive) // Type<unknown, bigint>
const t_positiveNumber = t(t_number).t(t_positive) // Type<unknown, number>

const foo = t(t_string).t(t_positive) // Error
```

You can create types with arguments

```ts
function t_minLength(value: string, minLength: number): string {
	if (value.length < minLength) throw new Error("Too short")
	return value
}

const foo = t(t_string).t(t_minLength, 2) // Type<unknown, string>
```

## Type Metadata

Not implemented yet.

It will let you check types, their chains, and their properties/arguments.

So you can generate UI for them, or use them for other purposes such as generating databases.
