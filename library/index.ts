type Shape = { [key: string]: Validator<any, any> }
type Obj = Record<string, any>
type Any = string | number | boolean | null | undefined | object | symbol | bigint
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never
function is<T>(_: unknown): asserts _ is T {}

export type Validator<T, P extends Obj | undefined> = {
	params: Readonly<P>
	assert(value: unknown): asserts value is T
	is(value: unknown): value is T
	parse(value: unknown): T
	type(value: T): T
}

export type $infer<T> = T extends Validator<infer U, any> ? U : never

export const $validator: {
	<T>(parser: (value: unknown) => asserts value is T): () => Validator<T, undefined>
	<T, P extends Obj>(parser: (value: unknown, params: P) => asserts value is T): (params: P) => Validator<T, P>
} = <T, P extends Obj | undefined>(parser: (value: unknown, params?: P) => asserts value is T) => {
	return (params?: P): Validator<T, P> => {
		Object.freeze(params)
		return {
			params: params!,
			assert(value: unknown) {
				return parser(value, params)
			},
			parse(value: unknown): T {
				parser(value, params)
				return value
			},
			is(value: unknown): value is T {
				try {
					this.parse(value)
					return true
				} catch {
					return false
				}
			},
			type(value: T): T {
				return value
			},
		}
	}
}

export const $string = $validator((value: unknown): asserts value is string => {
	if (typeof value !== "string") throw new TypeError(`Expected string, got ${value}`)
})
export const $number = $validator((value: unknown): asserts value is number => {
	if (typeof value !== "number") throw new TypeError(`Expected number, got ${value}`)
})
export const $int = $validator((value: unknown): asserts value is number => {
	if (!Number.isInteger(value)) throw new TypeError(`Expected integer, got ${value}`)
})
export const $bigint = $validator((value: unknown): asserts value is bigint => {
	if (typeof value !== "bigint") throw new TypeError(`Expected bigint, got ${value}`)
})
export const $boolean = $validator((value: unknown): asserts value is boolean => {
	if (typeof value !== "boolean") throw new TypeError(`Expected boolean, got ${value}`)
})
export const $symbol = $validator((value: unknown): asserts value is symbol => {
	if (typeof value !== "symbol") throw new TypeError(`Expected symbol, got ${value}`)
})
export const $function = $validator((value: unknown): asserts value is Function => {
	if (!(value instanceof Function)) throw new TypeError(`Expected function, got ${value}`)
})
export const $date = $validator((value: unknown): asserts value is Date => {
	if (!(value instanceof Date)) throw new TypeError(`Expected Date, got ${value}`)
})
export const $null = $validator((value: unknown): asserts value is null => {
	if (value !== null) throw new TypeError(`Expected null, got ${value}`)
})
export const $undefined = $validator((value: unknown): asserts value is undefined => {
	if (value !== undefined) throw new TypeError(`Expected undefined, got ${value}`)
})
export const $never = $validator((value: unknown): asserts value is never => {
	throw new TypeError(`Expected never, got ${value}`)
})
export const $unknown = $validator((_: unknown): asserts _ is unknown => {})
export const $any = $validator((_: unknown): asserts _ is any => {})

export const $literal = $validator(<T extends Any>(v: unknown, value: T): asserts v is T => {
	if (v !== value) throw new TypeError(`Expected ${value?.toString()}, got ${v}`)
})

export const $union = $validator(<T extends Validator<any, any>[]>(value: unknown, validators: T): asserts value is $infer<T[number]> => {
	for (const validator of validators) {
		try {
			validator.parse(value)
			return
		} catch (error) {
			continue
		}
	}
	throw new TypeError(`Expected one of ${validators.map((v) => v.toString()).join(", ")}, got ${value}`)
})

export const $intersection = $validator(
	<T extends Validator<object, any>[]>(value: unknown, ...validators: T): asserts value is UnionToIntersection<$infer<T[number]>> => {
		for (const validator of validators) validator.assert(value)
	}
)

export const $exclude = $validator(
	<T extends Validator<any, any>, U extends T[]>(
		value: unknown,
		validator: T,
		...excluded: U
	): asserts value is Exclude<$infer<T>, $infer<U[number]>> => {
		try {
			validator.assert(value)
			for (const ex of excluded) ex.assert(value)
			throw new TypeError(`Expected ${validator}, got ${value}`)
		} catch (error) {
			return
		}
	}
)

export const $object = $validator(
	<T extends Shape>(
		value: unknown,
		obj: T
	): asserts value is {
		[K in { [K in keyof T]: Validator<undefined, any> extends T[K] ? K : never }[keyof T]]?: $infer<T[K]>
	} & {
		[K in { [K in keyof T]: Validator<undefined, any> extends T[K] ? never : K }[keyof T]]: $infer<T[K]>
	} => {
		if (typeof value !== "object" || value === null) throw new TypeError(`Expected object, got ${value}`)
		is<Obj>(value)
		for (const [key, validator] of Object.entries(obj)) validator.parse(value[key])
	}
)

export const $optional = <T extends Validator<any, any>>(validator: T) => $union([validator, $null(), $undefined()])

export const $array = $validator(<T extends Validator<any, any>>(value: unknown, validator: T): asserts value is $infer<T>[] => {
	if (!Array.isArray(value)) throw new TypeError(`Expected array, got ${value}`)
	for (const v of value) validator.assert(v)
})

export const $tuple = $validator(
	<T extends Validator<any, any>[]>(value: unknown, ...validators: T): asserts value is { [k in keyof T]: $infer<T[k]> } => {
		if (!Array.isArray(value)) throw new TypeError(`Expected array, got ${value}`)
		if (value.length !== validators.length) throw new TypeError(`Expected tuple of length ${validators.length}, got ${value}`)
		for (let i = 0; i < validators.length; i++) validators[i]!.parse(value[i])
	}
)

export const $record = $validator(
	<K extends Validator<any, any>, V extends Validator<any, any>>(
		value: unknown,
		params: {
			keyValidator: K
			valueValidator: V
		}
	): asserts value is Record<$infer<K>, $infer<V>> => {
		if (typeof value !== "object" || value === null) throw new TypeError(`Expected object, got ${value}`)
		for (const [key, val] of Object.entries(value)) {
			params.keyValidator.assert(key)
			params.valueValidator.assert(val)
		}
	}
)

export const $map = $validator(
	<K extends Validator<any, any>, V extends Validator<any, any>>(
		value: unknown,
		params: {
			keyValidator: K
			valueValidator: V
		}
	): asserts value is Map<$infer<K>, $infer<V>> => {
		if (!(value instanceof Map)) throw new TypeError(`Expected Map, got ${value}`)
		for (const [key, val] of value) {
			params.keyValidator.assert(key)
			params.valueValidator.assert(val)
		}
	}
)

export const $set = $validator(<T extends Validator<any, any>>(value: unknown, validator: T): asserts value is Set<$infer<T>> => {
	if (!(value instanceof Set)) throw new TypeError(`Expected Set, got ${value}`)
	for (const v of value) validator.assert(v)
})

export const $instanceOf = $validator(<T extends new (...args: any[]) => any>(value: unknown, constructor: T): asserts value is InstanceType<T> => {
	if (!(value instanceof constructor)) throw new TypeError(`Expected instance of ${constructor.name}, got ${value}`)
})

export const $enum = $validator(<T extends (string | number)[]>(value: unknown, values: T): asserts value is T[number] => {
	if (!values.includes(value as any)) throw new TypeError(`Expected ${value} to be one of ${values}`)
})

export const $gt = $validator(
	<T extends Validator<number | bigint, any>>(value: unknown, params: { validator: T; gt: $infer<T> }): asserts value is $infer<T> => {
		params.validator.assert(value)
		if (value <= params.gt) throw new TypeError(`Expected ${value} to be greater than ${params.gt}`)
	}
)

export const $gte = $validator(
	<T extends Validator<number | bigint, any>>(value: unknown, params: { validator: T; gte: $infer<T> }): asserts value is $infer<T> => {
		params.validator.assert(value)
		if (value < params.gte) throw new TypeError(`Expected ${value} to be greater than or equal to ${params.gte}`)
	}
)

export const $lt = $validator(
	<T extends Validator<number | bigint, any>>(value: unknown, params: { validator: T; lt: $infer<T> }): asserts value is $infer<T> => {
		params.validator.assert(value)
		if (value >= params.lt) throw new TypeError(`Expected ${value} to be less than ${params.lt}`)
	}
)

export const $lte = $validator(
	<T extends Validator<number | bigint, any>>(value: unknown, params: { validator: T; lte: $infer<T> }): asserts value is $infer<T> => {
		params.validator.assert(value)
		if (value > params.lte) throw new TypeError(`Expected ${value} to be less than or equal to ${params.lte}`)
	}
)

export const $range = $validator(
	<T extends Validator<number | bigint, any>>(
		value: unknown,
		params: { validator: T; min: $infer<T>; max: $infer<T> }
	): asserts value is $infer<T> => {
		params.validator.assert(value)
		if (value < params.min || value > params.max) throw new TypeError(`Expected ${value} to be between ${params.min} and ${params.max}`)
	}
)

export const $finite = $validator(<T extends Validator<number, any>>(value: unknown, validator: T): asserts value is number => {
	validator.assert(value)
	if (!Number.isFinite(value)) throw new TypeError(`Expected ${value} to be finite`)
})

export const $length = $validator(
	<T extends Validator<string | Array<any>, any>>(value: unknown, params: { validator: T; length: number }): asserts value is $infer<T> => {
		params.validator.assert(value)
		if (value.length !== params.length) throw new TypeError(`Expected ${value} to have length ${params.length}`)
	}
)

export const $minLength = $validator(
	<T extends Validator<string | Array<any>, any>>(value: unknown, params: { validator: T; minLength: number }): asserts value is $infer<T> => {
		params.validator.assert(value)
		if (value.length < params.minLength) throw new TypeError(`Expected ${value} to have length at least ${params.minLength}`)
	}
)

export const $maxLength = $validator(
	<T extends Validator<string | Array<any>, any>>(value: unknown, params: { validator: T; maxLength: number }): asserts value is $infer<T> => {
		params.validator.assert(value)
		if (value.length > params.maxLength) throw new TypeError(`Expected ${value} to have length at most ${params.maxLength}`)
	}
)

export const $lengthRange = $validator(
	<T extends Validator<string | Array<any>, any>>(
		value: unknown,
		params: { validator: T; minLength: number; maxLength: number }
	): asserts value is $infer<T> => {
		params.validator.assert(value)
		if (value.length < params.minLength || value.length > params.maxLength)
			throw new TypeError(`Expected ${value} to have length between ${params.minLength} and ${params.maxLength}`)
	}
)

export const $regex = $validator(
	<T extends Validator<string, any>>(value: unknown, params: { validator: T; regex: RegExp }): asserts value is $infer<T> => {
		params.validator.assert(value)
		if (!params.regex.test(value)) throw new TypeError(`Expected ${value} to match ${params.regex}`)
	}
)

export const $startsWith = $validator(
	<T extends Validator<string, any>, P extends string>(
		value: unknown,
		params: { validator: T; prefix: P }
	): asserts value is `${P}${$infer<T>}` => {
		params.validator.assert(value)
		if (!value.startsWith(params.prefix)) throw new TypeError(`Expected ${value} to start with ${params.prefix}`)
	}
)

export const $endsWith = $validator(
	<T extends Validator<string, any>, S extends string>(
		value: unknown,
		params: { validator: T; suffix: S }
	): asserts value is `${$infer<T>}${S}` => {
		params.validator.assert(value)
		if (!value.endsWith(params.suffix)) throw new TypeError(`Expected ${value} to end with ${params.suffix}`)
	}
)

export const $contains = $validator(
	<T extends Validator<string, any>, S extends string>(
		value: unknown,
		params: { validator: T; substring: S }
	): asserts value is `${$infer<T>}${S}${$infer<T>}` => {
		params.validator.assert(value)
		if (!value.includes(params.substring)) throw new TypeError(`Expected ${value} to contain ${params.substring}`)
	}
)

export const $email = $validator(
	<T extends Validator<string, any>>(
		value: unknown,
		validator: T
	): asserts value is `${string[0]}${string}@${string[0]}${string}.${string[0]}${string}` => {
		validator.assert(value)
		if (
			!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(
				value
			)
		)
			throw new TypeError(`Expected ${value} to be a valid email address`)
	}
)

export const $url = $validator(
	<T extends Validator<string, any>>(
		value: unknown,
		validator: T
	): asserts value is `${"https" | "http"}://${string[0]}${string}.${string[0]}${string}` => {
		validator.assert(value)
		if (!/^(https?:\/\/)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+/.test(value)) throw new TypeError(`Expected ${value} to be a valid URL`)
	}
)

export const $uri = $validator(
	<T extends Validator<string, any>>(value: unknown, validator: T): asserts value is `${string[0]}${string}://${string[0]}${string}` => {
		validator.assert(value)
		if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) throw new TypeError(`Expected ${value} to be a valid URI`)
	}
)

export const $dateISO = $validator(
	<T extends Validator<string, any>>(value: unknown, validator: T): asserts value is `${number}-${number}-${number}` => {
		validator.assert(value)
		if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new TypeError(`Expected ${value} to be a valid ISO date`)
	}
)

export const $timeISO = $validator(
	<T extends Validator<string, any>>(value: unknown, validator: T): asserts value is `${number}:${number}:${number}` => {
		validator.assert(value)
		if (!/^\d{2}:\d{2}:\d{2}$/.test(value)) throw new TypeError(`Expected ${value} to be a valid ISO time`)
	}
)

export const $dateTimeISO = $validator(
	<T extends Validator<string, any>>(
		value: unknown,
		validator: T
	): asserts value is `${number}-${number}-${number}T${number}:${number}:${number}` => {
		validator.assert(value)
		if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) throw new TypeError(`Expected ${value} to be a valid ISO date-time`)
	}
)
