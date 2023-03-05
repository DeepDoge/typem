type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never

function got(value: unknown) {
	return `${value}` ? `${typeof value}: ${value}` : typeof value
}

export type TypeCreator<T> = {
	(...validators: Validator<T>[]): Type<T>
}
export type Type<T> = {
	parseOrThrow(value: unknown): T
	assert(value: unknown): asserts value is T
	is(value: unknown): value is T
}

export type ValidatorCreator<T, P extends any[]> = {
	(...params: P): Validator<T>
}
export type Validator<T> = {
	validate(value: T): asserts value is T
}

export type $infer<T> = T extends Type<infer U> ? U : T extends Validator<infer U> ? U : never

export function $type<T>(validator: Validator<T>["validate"]) {
	const creator: TypeCreator<T> = (...validators: Validator<T>[]) => {
		const allValidators = [{ validate: validator }].concat(validators)
		const validateAll = (value: T) => allValidators.forEach((validator) => validator.validate(value))
		const type: Type<T> = {
			parseOrThrow(value: T) {
				validateAll(value)
				return value
			},
			assert(value: T) {
				validateAll(value)
			},
			is(value: T): value is T {
				try {
					validateAll(value)
					return true
				} catch {
					return false
				}
			},
		}
		return type
	}
	return creator
}
export function $validator<T, P extends any[]>(validator: (value: T, ...params: P) => asserts value is T): (...params: P) => Validator<T> {
	return (...params: P) => ({ validate: (value: T) => validator(value, ...params) })
}
export type TypeWithShape<T, S extends Type<any>[] | Record<string, Type<any>>> = Type<T> & {
	shape: S
}
export function $shape<T, S extends Type<any>[] | Record<string, Type<any>>>(shape: S, validator: Validator<T>["validate"]): TypeWithShape<T, S> {
	return Object.assign($type(validator)(), { shape })
}

// PRIMATIVE TYPES
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
export const $union = <T extends Type<any>[]>(...types: T) =>
	$type<$infer<T[number]>>((value: unknown) => {
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
	})()
export const $optional = <T extends Type<any>>(type: T) => $union(type, $null(), $undefined())

export const $intersection = <T extends Type<object>[]>(...types: T) =>
	$type<UnionToIntersection<$infer<T[number]>>>((value: unknown) => {
		for (const type of types) type.assert(value)
	})()

// TODO: Union and Intersection information will be on the Type object itself, so this will just remove the unions from there instead
export const $exclude = <T extends Type<any>, E extends T[]>(type: T, ...excluded: E) =>
	$type<Exclude<$infer<T>, $infer<E[number]>>>((value: unknown) => {
		try {
			type.assert(value)
			for (const ex of excluded) ex.assert(value)
			throw new TypeError(`Expected ${type}, got ${got(value)}`)
		} catch (error) {
			return
		}
	})()

// SHAPED TYPES
export const $object = <T extends Record<string, Type<any>>>(shape: T) =>
	$shape(
		shape,
		(
			value: {
				[K in { [K in keyof T]: Type<undefined> extends T[K] ? K : never }[keyof T]]?: $infer<T[K]>
			} & {
				[K in { [K in keyof T]: Type<undefined> extends T[K] ? never : K }[keyof T]]: $infer<T[K]>
			}
		) => {
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
	)

export const $tuple = <T extends Type<any>[]>(...types: T) =>
	$shape(types, (value: { [k in keyof T]: $infer<T[k]> }) => {
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
	})

// IDK
export const $array = <T extends Type<any>>(type: T) =>
	$type<$infer<T>[]>((value: unknown) => {
		if (!Array.isArray(value)) throw new TypeError(`Expected array, got ${got(value)}`)
		for (let i = 0; i < value.length; i++) {
			try {
				type.assert(value[i])
			} catch (error) {
				if (error instanceof TypeError) throw new TypeError(`[${i}]: ${error.message}`)
				throw error
			}
		}
	})()

export const $record = <K extends Type<any>, V extends Type<any>>(keyType: K, valueType: V) =>
	$type<Record<$infer<K>, $infer<V>>>((value: unknown) => {
		if (typeof value !== "object" || value === null) throw new TypeError(`Expected object, got ${got(value)}`)
		for (const [key, val] of Object.entries(value)) {
			keyType.assert(key)
			valueType.assert(val)
		}
	})()

export const $map = <K extends Type<any>, V extends Type<any>>(keyType: K, valueType: V) =>
	$type<Map<$infer<K>, $infer<V>>>((value: unknown) => {
		if (!(value instanceof Map)) throw new TypeError(`Expected Map, got ${got(value)}`)
		for (const [key, val] of value) {
			keyType.assert(key)
			valueType.assert(val)
		}
	})()

export const $set = <T extends Type<any>>(type: T) =>
	$type<Set<$infer<T>>>((value: unknown) => {
		if (!(value instanceof Set)) throw new TypeError(`Expected Set, got ${got(value)}`)
		for (const v of value) type.assert(v)
	})()

export const $instanceOf = <T extends new (...args: any[]) => any>(constructor: T) =>
	$type<InstanceType<T>>((value: unknown) => {
		if (!(value instanceof constructor)) throw new TypeError(`Expected instance of ${constructor.name}, got ${got(value)}`)
	})()

export const $enum = <T extends readonly (string | number)[]>(...values: T) =>
	$type<T[number]>((value: unknown) => {
		if (!values.includes(value as never)) throw new TypeError(`Expected one of [${values.join(", ")}], got ${got(value)}`)
	})()

export const $literal = <T extends string | number | boolean | null | undefined | object | symbol | bigint>(literal: T) =>
	$type<T>((value: unknown) => {
		if (value !== literal) throw new TypeError(`Expected literal ${literal?.toString()}, got ${got(value)}`)
	})()

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

export const $regex = $validator(<T extends string>(value: T, regex: RegExp) => {
	if (!regex.test(value)) throw new TypeError(`Expected ${got(value)} to match ${regex}`)
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

export const $email = $validator(<T extends string>(value: T) => {
	if (
		!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(
			value
		)
	)
		throw new TypeError(`Expected ${got(value)} to be a valid email address`)
})
export const $url = $validator(<T extends string>(value: T) => {
	if (!/^(https?:\/\/)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+/.test(value)) throw new TypeError(`Expected ${got(value)} to be a valid URL`)
})
export const $uri = $validator(<T extends string>(value: T) => {
	if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) throw new TypeError(`Expected ${got(value)} to be a valid URI`)
})
export const $dateISO = $validator(<T extends string>(value: T) => {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new TypeError(`Expected ${got(value)} to be a valid ISO date`)
})
export const $timeISO = $validator(<T extends string>(value: T) => {
	if (!/^\d{2}:\d{2}:\d{2}$/.test(value)) throw new TypeError(`Expected ${got(value)} to be a valid ISO time`)
})
export const $dateTimeISO = $validator(<T extends string>(value: T) => {
	if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) throw new TypeError(`Expected ${got(value)} to be a valid ISO date-time`)
})
