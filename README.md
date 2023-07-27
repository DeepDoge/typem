# Typem

An easy to use and extend runtime type checker for TypeScript, with support for type metadata.

Checkout the source code yourself, it's just one file.

# Installation

[Install Instructions](https://github.com/DeepDoge/typem/releases)

# Usage

```ts
const tPerson = tObject({
	name: tString(vLengthRange(1, 32)),
	age: tUnion(tNull(), tNumber(vGt(18))),
	sex: tUnion(tLiteral("man"), tLiteral("woman")),
	city: tOptional(
		tEnum(
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

const tMemberRole = tEnum("admin", "moderator", "user")
const tMember = tIntersection(
	tPerson,
	tObject({
		id: tString(vLength(32)),
		role: tMemberRole,
	})
)
```

Type of tMember:

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
if (tMember.validate(unknownValue)) {
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
const value = tMember.returnOrThrow(unknownValue) // throws error if value is invalid
// Then you can use it like this with the correct type
value.name // string
```

Also, you can use `Typem.InferType` type to get the type of a `Type`

```ts
type TypeOfMember = Typem.InferType<typeof tMember>
```

## Creating Types and Validators

You can create your own Types or Validators

```ts
class MyClass {}
const tMyClass = Typem.defineType<MyClass>((value: unknown) => {
	if (!(value instanceof MyClass)) throw new Error("Not a MyClass")
})

// tPostive validator can only be used with bigint and number types
const vPositive = Typem.defineValidator(<T extends bigint | number>(value: T) => {
	if (value < 0) throw new Error("Not a positive number")
})

const tPositiveBigInt = tBigint(vPositive())
const tPositiveNumber = tNumber(vPositive())
```

If you have a complex type, you can use `tComplexType` instead of `Typem.defineType`<br/>
Complex types are also used internally to create `tMap`, `tUnion`, `tExclude` and etc.

```ts
type tField<T> = Typem.Type<T> & {
	field: {
		name: string
		description: string
	}
}
export const tField = Typem.defineComplexType(<T>(self: tField<T>, type: Typem.Type<T>, field: (typeof self)["field"]) => {
	self.field = field

	return (...args) => type.validateOrThrow(...args)
})

const tName = tField(tString(), { name: "Name", description: "The name of the field" })
const tAge = tField(tUnion(tInt(vGte(18)), tNull()), { name: "Age", description: "The age of the field", default: 18 })

tName.field.name // Name
tName.field.description // The name of the field

tAge.field.name // Age
tAge.field.description // The age of the field

const nameValue = "John" as unknown
const ageValue = null as unknown

const name = tName.returnOrThrow(nameValue) // John
const age = tAge.returnOrThrow(ageValue)
```

Something like `tField` can be used for creating schemas for your form generator.
