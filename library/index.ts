type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never

function got(value: unknown) {
	return `${value}` ? `${typeof value}: ${value}` : typeof value
}

export type $infer<T extends Type<any> | Validator<any>> = T extends Type<infer U> ? U : T extends Validator<infer U> ? U : never

export type TypeCreator<T> = { (): Type<T> }
export interface Type<T> {
	creator: TypeCreator<T>
	parseOrThrow(value: unknown): T
	assert(value: unknown): asserts value is T
	validate(value: unknown): value is T
	instanceOf<U extends TypeCreator<unknown>>(creator: U): this is ReturnType<U>
}

export type ValidatorCreator<T, P extends any[]> = { (...params: P): Validator<T> }
export type Validator<T> = {
	validate(value: T): asserts value is T
}

export function $validator<T, P extends any[]>(validate: (value: T, ...params: P) => asserts value is T): ValidatorCreator<T, P> {
	return (...params: P) => ({ validate: (value: T) => validate(value, ...params) })
}

export function $type<T>(validator: { (value: unknown): asserts value is T }) {
	return function creator(...validators: Validator<T>[]): Type<T> {
		const type: Type<T> = {
			creator,
			parseOrThrow(value: T) {
				validate(value)
				return value
			},
			assert(value: T) {
				validate(value)
			},
			validate(value: T): value is T {
				try {
					validate(value)
					return true
				} catch {
					return false
				}
			},
			instanceOf(otherCreator: unknown) {
				return otherCreator === creator
			},
		}
		function validate(value: T) {
			validator(value)
			validators.forEach((validator) => validator.validate(value))
		}

		return type
	}
}
function $type2<R extends Type<any>, P extends any[] | readonly any[]>(init: (self: R, ...params: P) => (value: unknown) => void) {
	type T = $infer<R>
	return function creator(...params: P): R {
		const type: Type<T> = {
			creator,
			parseOrThrow(value: T) {
				validate(value)
				return value
			},
			assert(value: T) {
				validate(value)
			},
			validate(value: T): value is T {
				try {
					validate(value)
					return true
				} catch {
					return false
				}
			},
			instanceOf(otherCreator: unknown) {
				return otherCreator === creator
			},
		}
		const validator = init(type as R, ...params)
		function validate(value: T) {
			validator(value)
			params.forEach((param) => param?.validate?.(value))
		}

		return type as R
	}
}

// TYPES
export const $string = $type<string>((value: unknown) => {
	if (typeof value !== "string") throw new TypeError(`Expected string, got ${got(value)}`)
})
export const $number = $type<number>((value: unknown) => {
	if (typeof value !== "number") throw new TypeError(`Expected number, got ${got(value)}`)
})
export const $int = $type<number>((value: unknown) => {
	if (!Number.isInteger(value)) throw new TypeError(`Expected integer, got ${got(value)}`)
})
export const $bigint = $type<bigint>((value: unknown) => {
	if (typeof value !== "bigint") throw new TypeError(`Expected bigint, got ${got(value)}`)
})
export const $boolean = $type<boolean>((value: unknown) => {
	if (typeof value !== "boolean") throw new TypeError(`Expected boolean, got ${got(value)}`)
})
export const $symbol = $type<symbol>((value: unknown) => {
	if (typeof value !== "symbol") throw new TypeError(`Expected symbol, got ${got(value)}`)
})
export const $function = $type<Function>((value: unknown) => {
	if (!(value instanceof Function)) throw new TypeError(`Expected function, got ${got(value)}`)
})
export const $date = $type<Date>((value: unknown) => {
	if (!(value instanceof Date)) throw new TypeError(`Expected Date, got ${got(value)}`)
})
export const $null = $type<null>((value: unknown) => {
	if (value !== null) throw new TypeError(`Expected null, got ${got(value)}`)
})
export const $undefined = $type<undefined>((value: unknown) => {
	if (value !== undefined) throw new TypeError(`Expected undefined, got ${got(value)}`)
})
export const $unknown = $type((_: unknown): asserts _ is unknown => {})

// UNION/EXCLUDE, INTERSECTION TYPES
export type TypeUnion<T> = Type<T> & {
	hasType<T>(creator: TypeCreator<T>): boolean
}
const unionsMap = new WeakMap<TypeUnion<any>, Map<TypeCreator<any>, Type<any>[]>>()
export const $union = $type2(<T extends Type<any>[]>(self: TypeUnion<$infer<T[number]>>, ...types: T) => {
	const creator2typesMap = unionsMap.get(self) ?? new Map<TypeCreator<any>, Type<any>[]>()
	unionsMap.set(self, creator2typesMap)
	for (const type of types) {
		const typesOfCreator = creator2typesMap.get(type.creator) ?? []
		creator2typesMap.set(type.creator, typesOfCreator)
		typesOfCreator.push(type)
	}

	self.hasType = (other: TypeCreator<any>) => {
		return unionsMap.get(self)!.has(other)
	}

	return (value) => {
		const errors: TypeError[] = []
		for (const type of types) {
			try {
				type.parseOrThrow(value)
				return
			} catch (error) {
				if (error instanceof TypeError) errors.push(error)
				else throw error
			}
		}
		throw new TypeError(`No match with any of the union types:\n${errors.map((error) => `\t${error.message}`).join("\n")}`)
	}
})
export const $optional = <T extends Type<any>>(type: T) => $union(type, $null(), $undefined())
export const $exclude = <T extends TypeUnion<any>, E>(union: T, ...excluded: TypeCreator<E>[]) => {
	const excludedSet = new Set(excluded)

	const creator2typesMap = unionsMap.get(union)
	if (!creator2typesMap) throw new TypeError(`Expected a union type`)
	const unions: Type<any>[] = []
	for (const creator of creator2typesMap.keys()) {
		if (!excludedSet.has(creator)) unions.push(...creator2typesMap.get(creator)!)
	}
	return $union(...unions) as TypeUnion<Exclude<$infer<T>, $infer<Type<E>>>>
}
export const $intersection = $type2(<T extends TypeShape<object, any>[]>(self: Type<UnionToIntersection<$infer<T[number]>>>, ...types: T) => {
	const creatorSet = new Set(types.map((type) => type.creator))
	self.instanceOf = (creator) => creatorSet.has(creator as TypeCreator<object>)
	return (value) => {
		for (const type of types) type.assert(value)
	}
})

// CUSTOM TYPES
export type Shape = Type<any>[] | Record<string, Type<any>>
export type TypeShape<T, S extends Shape> = Type<T> & {
	shape: S
}
export const $object = $type2(
	<T extends Record<string, Type<any>>>(
		self: TypeShape<
			{
				[K in { [K in keyof T]: Type<undefined> extends T[K] ? K : never }[keyof T]]?: $infer<T[K]>
			} & {
				[K in { [K in keyof T]: Type<undefined> extends T[K] ? never : K }[keyof T]]: $infer<T[K]>
			},
			T
		>,
		shape: T
	) => {
		self.shape = shape
		return (value) => {
			if (typeof value !== "object" || value === null) throw new TypeError(`Expected object, got ${got(value)}`)
			for (const [key, type] of Object.entries(shape)) {
				try {
					type.parseOrThrow(value[key as keyof typeof value])
				} catch (error) {
					if (error instanceof TypeError) throw new TypeError(`${key}: ${error.message}`)
					throw error
				}
			}
		}
	}
)
export const $tuple = $type2(<T extends Type<any>[]>(self: TypeShape<{ [k in keyof T]: $infer<T[k]> }, T>, ...types: T) => {
	self.shape = types
	return (value) => {
		if (!Array.isArray(value)) throw new TypeError(`Expected a tuple array, got ${got(value)}`)
		if (value.length !== types.length)
			throw new TypeError(`Expected tuple of length ${types.length}, got ${got(value)} with length ${value.length}`)
		for (let i = 0; i < types.length; i++) {
			try {
				types[i]!.parseOrThrow(value[i])
			} catch (error) {
				if (error instanceof TypeError) throw new TypeError(`[${i}]: ${error.message}`)
				throw error
			}
		}
	}
})

export type TypeArray<T extends Type<any>> = Type<$infer<T>[]> & {
	valueType: T
}
export const $array = $type2(<T extends Type<any>>(self: TypeArray<T>, type: T) => {
	self.valueType = type
	return (value) => {
		if (!Array.isArray(value)) throw new TypeError(`Expected array, got ${got(value)}`)
		for (let i = 0; i < value.length; i++) {
			try {
				type.assert(value[i])
			} catch (error) {
				if (error instanceof TypeError) throw new TypeError(`[${i}]: ${error.message}`)
				throw error
			}
		}
	}
})
export type TypeSet<T extends Type<any>> = Type<Set<$infer<T>>> & {
	valueType: T
}
export const $set = $type2(<T extends Type<any>>(self: TypeSet<T>, type: T) => {
	self.valueType = type
	return (value) => {
		if (!(value instanceof Set)) throw new TypeError(`Expected Set, got ${got(value)}`)
		value.forEach((item, index) => {
			try {
				type.assert(item)
			} catch (error) {
				if (error instanceof TypeError) throw new TypeError(`Set[${index}]: ${error.message}`)
				throw error
			}
		})
	}
})

export type TypeRecord<K extends Type<any>, V extends Type<any>> = Type<Record<$infer<K>, $infer<V>>> & {
	keyType: K
	valueType: V
}
export const $record = $type2(<K extends Type<string | number>, V extends Type<any>>(self: TypeRecord<K, V>, keyType: K, valueType: V) => {
	self.keyType = keyType
	self.valueType = valueType
	return (value) => {
		if (typeof value !== "object" || value === null) throw new TypeError(`Expected object, got ${got(value)}`)
		for (const pair of Object.entries(value)) {
			const [key, value] = pair
			keyType.assert(key)
			valueType.assert(value)
		}
	}
})
export type TypeMap<K extends Type<any>, V extends Type<any>> = Type<Map<$infer<K>, $infer<V>>> & {
	keyType: K
	valueType: V
}
export const $map = $type2(<K extends Type<any>, V extends Type<any>>(self: TypeMap<K, V>, keyType: K, valueType: V) => {
	self.keyType = keyType
	self.valueType = valueType
	return (value) => {
		if (!(value instanceof Map)) throw new TypeError(`Expected Map, got ${got(value)}`)
		for (const pair of value) {
			const [key, value] = pair
			keyType.assert(key)
			valueType.assert(value)
		}
	}
})

type Constructor = new (...args: any[]) => any
export type TypeInstance<T extends Constructor> = Type<InstanceType<T>> & {
	constructor: T
}
export const $instanceOf = $type2(<T extends Constructor>(self: TypeInstance<T>, constructor: T) => {
	self.constructor = constructor
	return (value: unknown) => {
		if (!(value instanceof constructor)) throw new TypeError(`Expected instance of ${constructor.name}, got ${got(value)}`)
	}
})

export type Enum = readonly (string | number)[]
export type TypeEnum<T extends Enum> = Type<T[number]> & {
	enum: T
}
export const $enum = $type2(<T extends Enum>(self: TypeEnum<T>, ...values: T) => {
	self.enum = values
	return (value) => {
		if (!values.includes(value as never)) throw new TypeError(`Expected one of [${values.join(", ")}], got ${got(value)}`)
	}
})

export type Literal = string | number | boolean | null | undefined | object | symbol | bigint
export type TypeLiteral<T extends Literal> = Type<T> & {
	literal: T
}
export const $literal = $type2(<T extends Literal>(self: TypeLiteral<T>, literal: T) => {
	self.literal = literal
	return (value: unknown) => {
		if (value !== literal) throw new TypeError(`Expected literal ${literal?.toString()}, got ${got(value)}`)
	}
})

// VALIDATION TYPES
export const $gt = $validator(<T extends number | bigint>(value: T, gt: T) => {
	if (value <= gt) throw new TypeError(`Expected ${got(value)} to be greater than ${gt}`)
})
export const $gte = $validator(<T extends number | bigint>(value: T, gte: T) => {
	if (value < gte) throw new TypeError(`Expected ${got(value)} to be greater than or equal to ${gte}`)
})
export const $lt = $validator(<T extends number | bigint>(value: T, lt: T) => {
	if (value >= lt) throw new TypeError(`Expected ${got(value)} to be less than ${lt}`)
})
export const $lte = $validator(<T extends number | bigint>(value: T, lte: T) => {
	if (value > lte) throw new TypeError(`Expected ${got(value)} to be less than or equal to ${lte}`)
})
export const $range = $validator(<T extends number | bigint>(value: T, min: T, max: T) => {
	if (value < min || value > max) throw new TypeError(`Expected ${got(value)} to be between ${min} and ${max}`)
})
export const $finite = $validator(<T extends number>(value: T) => {
	if (!Number.isFinite(value)) throw new TypeError(`Expected ${got(value)} to be finite`)
})

export const $length = $validator(<T extends string | Array<any>>(value: T, length: number) => {
	if (value.length !== length) throw new TypeError(`Expected ${got(value)} to have length ${length}`)
})
export const $minLength = $validator(<T extends string | Array<any>>(value: T, minLength: number) => {
	if (value.length < minLength) throw new TypeError(`Expected ${got(value)} to have length at least ${minLength}`)
})
export const $maxLength = $validator(<T extends string | Array<any>>(value: T, maxLength: number) => {
	if (value.length > maxLength) throw new TypeError(`Expected ${got(value)} to have length at most ${maxLength}`)
})
export const $lengthRange = $validator(<T extends string | Array<any>>(value: T, minLength: number, maxLength: number) => {
	if (value.length < minLength || value.length > maxLength)
		throw new TypeError(`Expected ${got(value)} to have length between ${minLength} and ${maxLength}`)
})

export const $startsWith = $validator(<T extends string, P extends string>(value: T, prefix: P) => {
	if (!value.startsWith(prefix)) throw new TypeError(`Expected ${got(value)} to start with ${prefix}`)
})
export const $endsWith = $validator(<T extends string, S extends string>(value: T, suffix: S) => {
	if (!value.endsWith(suffix)) throw new TypeError(`Expected ${got(value)} to end with ${suffix}`)
})
export const $contains = $validator(<T extends string, S extends string>(value: T, substring: S) => {
	if (!value.includes(substring)) throw new TypeError(`Expected ${got(value)} to contain ${substring}`)
})

export const $regex = $validator(<T extends string>(value: T, regex: RegExp) => {
	if (!regex.test(value)) throw new TypeError(`Expected ${got(value)} to match ${regex}`)
})
export const $email = () =>
	$regex(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/)
export const $url = () => $regex(/^(https?:\/\/)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+/)
export const $uri = () => $regex(/^[a-zA-Z][a-zA-Z0-9+.-]*:/)
export const $dateISO = () => $regex(/^\d{4}-\d{2}-\d{2}$/)
export const $timeISO = () => $regex(/^\d{2}:\d{2}:\d{2}$/)
export const $dateTimeISO = () => $regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
