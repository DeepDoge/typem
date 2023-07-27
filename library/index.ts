const ErrorBase = Error
export namespace Typem {
	export type InferType<T extends Type<any> | Validator<any>> = T extends Type<infer U> ? U : T extends Validator<infer U> ? U : never

	export class Error extends ErrorBase {}

	export namespace Type {
		export type Creator<T> = { (...args: any): Type<T> }
	}
	export interface Type<T> {
		creator: Type.Creator<T>
		returnOrThrow(value: unknown): T
		validateOrThrow(value: unknown): asserts value is T
		validate(value: unknown): value is T
		is<U extends Type.Creator<any>>(creator: U): this is ReturnType<U>
	}

	export namespace Validator {
		export type Creator<T, P extends any[]> = { (...params: P): Validator<T> }
	}
	export type Validator<T> = {
		validate(value: T): asserts value is T
	}

	export function defineValidator<T, P extends any[]>(validator: (value: T, ...params: P) => asserts value is T): Validator.Creator<T, P> {
		return (...params: P) => ({
			validate(value: T) {
				validator(value, ...params)
			},
		})
	}

	export function defineType<T>(validator: { (value: unknown): asserts value is T }) {
		return function creator(...validators: Validator<T>[]): Type<T> {
			const type: Type<T> = {
				creator,
				validateOrThrow(value: T) {
					validator(value)
					validators.forEach((validator) => validator.validate(value))
				},
				returnOrThrow(value: T) {
					type.validateOrThrow(value)
					return value
				},
				validate(value: T): value is T {
					try {
						type.validateOrThrow(value)
						return true
					} catch {
						return false
					}
				},
				is(otherCreator: unknown) {
					return otherCreator === type.creator
				},
			}

			return type
		}
	}
	export function defineComplexType<R extends Type<any>, P extends any[] | readonly any[]>(
		init: (self: R, ...params: P) => (value: unknown) => asserts value is InferType<R>
	) {
		type T = InferType<R>
		return function creator(...params: P): R {
			const type: Type<T> = {
				creator,
				validateOrThrow(value: T) {
					validator(value)
					params.forEach((param) => param?.validate?.(value))
				},
				returnOrThrow(value: T) {
					type.validateOrThrow(value)
					return value
				},
				validate(value: T): value is T {
					try {
						type.validateOrThrow(value)
						return true
					} catch {
						return false
					}
				},
				is(otherCreator: unknown) {
					return otherCreator === type.creator
				},
			}
			const _validator = init(type as R, ...params)
			const validator: typeof _validator = _validator

			return type as R
		}
	}
}

function got(value: unknown) {
	return `${value}` ? `${typeof value}: ${value}` : typeof value
}

// TYPES
export const tString = Typem.defineType<string>((value) => {
	if (typeof value !== "string") throw new Typem.Error(`Expected string, got ${got(value)}`)
})
export const tNumber = Typem.defineType<number>((value) => {
	if (typeof value !== "number") throw new Typem.Error(`Expected number, got ${got(value)}`)
})
export const tInt = Typem.defineType<number>((value) => {
	if (!Number.isInteger(value)) throw new Typem.Error(`Expected integer, got ${got(value)}`)
})
export const tBigint = Typem.defineType<bigint>((value) => {
	if (typeof value !== "bigint") throw new Typem.Error(`Expected bigint, got ${got(value)}`)
})
export const tBoolean = Typem.defineType<boolean>((value) => {
	if (typeof value !== "boolean") throw new Typem.Error(`Expected boolean, got ${got(value)}`)
})
export const tSymbol = Typem.defineType<symbol>((value) => {
	if (typeof value !== "symbol") throw new Typem.Error(`Expected symbol, got ${got(value)}`)
})
export const tFunction = Typem.defineType<Function>((value) => {
	if (!(value instanceof Function)) throw new Typem.Error(`Expected function, got ${got(value)}`)
})
export const tDate = Typem.defineType<Date>((value) => {
	if (!(value instanceof Date)) throw new Typem.Error(`Expected Date, got ${got(value)}`)
})
export const tNull = Typem.defineType<null>((value) => {
	if (value !== null) throw new Typem.Error(`Expected null, got ${got(value)}`)
})
export const tUndefined = Typem.defineType<undefined>((value) => {
	if (value !== undefined) throw new Typem.Error(`Expected undefined, got ${got(value)}`)
})
export const tUnknown = Typem.defineType((_): asserts _ is unknown => {})

export type tUnion<T extends readonly Typem.Type<any>[]> = Typem.Type<Typem.InferType<T[number]>> & {
	unions: T
}
export const tUnion = Typem.defineComplexType(<T extends readonly Typem.Type<any>[]>(self: tUnion<T>, ...types: T) => {
	const unions = new Set(types.map((type) => type.creator))
	self.unions = types
	self.is = (other: Typem.Type.Creator<any>) => {
		if (other === tUnion) return true
		return unions.has(other)
	}

	return (value) => {
		const errors: Typem.Error[] = []
		for (const type of types) {
			try {
				type.returnOrThrow(value)
				return
			} catch (error) {
				if (error instanceof Typem.Error) errors.push(error)
				else throw error
			}
		}
		throw new Typem.Error(`No match with any of the union types:\n${errors.map((error) => `\t${error.message}`).join("\n")}`)
	}
})
export const tOptional = <T extends Typem.Type<any>>(type: T) => tUnion(type, tNull(), tUndefined())

export const tBytes = Typem.defineType<Uint8Array>((value) => {
	if (!(value instanceof Uint8Array)) throw new Typem.Error(`Expected Uint8Array, got ${got(value)}`)
})

type _Helper<T extends Record<PropertyKey, Typem.Type<any>>> = {
	[K in { [K in keyof T]: Typem.Type<undefined> extends T[K] ? never : K }[keyof T]]: Typem.InferType<T[K]>
}
export type tObject<T extends Record<PropertyKey, Typem.Type<any>>> = Typem.Type<
	{
		[K in { [K in keyof _Helper<T>]: undefined extends _Helper<T>[K] ? K : never }[keyof _Helper<T>]]?: Typem.InferType<T[K]>
	} & {
		[K in { [K in keyof _Helper<T>]: undefined extends _Helper<T>[K] ? never : K }[keyof _Helper<T>]]: Typem.InferType<T[K]>
	}
> & {
	shape: T
}
export const tObject = Typem.defineComplexType(<T extends Record<PropertyKey, Typem.Type<any>>>(self: tObject<T>, shape: T) => {
	self.shape = shape
	return (value) => {
		if (typeof value !== "object" || value === null) throw new Typem.Error(`Expected object, got ${got(value)}`)
		for (const [key, type] of Object.entries(shape)) {
			try {
				type.returnOrThrow(value[key as keyof typeof value])
			} catch (error) {
				if (error instanceof Typem.Error) throw new Typem.Error(`${key}: ${error.message}`)
				throw error
			}
		}
	}
})
export type tTuple<T extends Typem.Type<any>[]> = Typem.Type<{ [k in keyof T]: Typem.InferType<T[k]> }> & {
	shape: T
}
export const tTuple = Typem.defineComplexType(<T extends Typem.Type<any>[]>(self: tTuple<T>, ...types: T) => {
	self.shape = types
	return (value) => {
		if (!Array.isArray(value)) throw new Typem.Error(`Expected a tuple array, got ${got(value)}`)
		if (value.length !== types.length)
			throw new Typem.Error(`Expected tuple of length ${types.length}, got ${got(value)} with length ${value.length}`)
		for (let i = 0; i < types.length; i++) {
			try {
				types[i]!.returnOrThrow(value[i])
			} catch (error) {
				if (error instanceof Typem.Error) throw new Typem.Error(`[${i}]: ${error.message}`)
				throw error
			}
		}
	}
})
type ArrayToIntersection<U extends tObject<any>[]> = U extends [infer F extends tObject<any>, ...infer R extends tObject<any>[]]
	? F["shape"] & ArrayToIntersection<R>
	: {}
export const tIntersection = <T extends tObject<any>[]>(...types: T) =>
	tObject(Object.assign({}, ...types.map((type) => type.shape))) as tObject<ArrayToIntersection<T>>

export type tArray<T extends Typem.Type<any>> = Typem.Type<Typem.InferType<T>[]> & {
	valueType: T
}
export const tArray = Typem.defineComplexType(<T extends Typem.Type<any>>(self: tArray<T>, type: T) => {
	self.valueType = type
	return (value) => {
		if (!Array.isArray(value)) throw new Typem.Error(`Expected array, got ${got(value)}`)
		for (let i = 0; i < value.length; i++) {
			try {
				type.validateOrThrow(value[i])
			} catch (error) {
				if (error instanceof Typem.Error) throw new Typem.Error(`[${i}]: ${error.message}`)
				throw error
			}
		}
	}
})
export type tSet<T extends Typem.Type<any>> = Typem.Type<Set<Typem.InferType<T>>> & {
	valueType: T
}
export const tSet = Typem.defineComplexType(<T extends Typem.Type<any>>(self: tSet<T>, type: T) => {
	self.valueType = type
	return (value) => {
		if (!(value instanceof Set)) throw new Typem.Error(`Expected Set, got ${got(value)}`)
		value.forEach((item, index) => {
			try {
				type.validateOrThrow(item)
			} catch (error) {
				if (error instanceof Typem.Error) throw new Typem.Error(`Set[${index}]: ${error.message}`)
				throw error
			}
		})
	}
})

export type tRecord<K extends Typem.Type<any>, V extends Typem.Type<any>> = Typem.Type<Record<Typem.InferType<K>, Typem.InferType<V>>> & {
	keyType: K
	valueType: V
}
export const tRecord = Typem.defineComplexType(
	<K extends Typem.Type<string | number>, V extends Typem.Type<any>>(self: tRecord<K, V>, keyType: K, valueType: V) => {
		self.keyType = keyType
		self.valueType = valueType
		return (value) => {
			if (typeof value !== "object" || value === null) throw new Typem.Error(`Expected object, got ${got(value)}`)
			for (const pair of Object.entries(value)) {
				const [key, value] = pair
				keyType.validateOrThrow(key)
				valueType.validateOrThrow(value)
			}
		}
	}
)
export type tMap<K extends Typem.Type<any>, V extends Typem.Type<any>> = Typem.Type<Map<Typem.InferType<K>, Typem.InferType<V>>> & {
	keyType: K
	valueType: V
}
export const tMap = Typem.defineComplexType(<K extends Typem.Type<any>, V extends Typem.Type<any>>(self: tMap<K, V>, keyType: K, valueType: V) => {
	self.keyType = keyType
	self.valueType = valueType
	return (value) => {
		if (!(value instanceof Map)) throw new Typem.Error(`Expected Map, got ${got(value)}`)
		for (const pair of value) {
			const [key, value] = pair
			keyType.validateOrThrow(key)
			valueType.validateOrThrow(value)
		}
	}
})

type Constructor = new (...args: any[]) => any
export type tInstance<T extends Constructor> = Typem.Type<InstanceType<T>> & {
	constructor: T
}
export const tInstanceOf = Typem.defineComplexType(<T extends Constructor>(self: tInstance<T>, constructor: T) => {
	self.constructor = constructor
	return (value: unknown) => {
		if (!(value instanceof constructor)) throw new Typem.Error(`Expected instance of ${constructor.name}, got ${got(value)}`)
	}
})

export type Enum = readonly (string | number)[]
export type tEnum<T extends Enum> = Typem.Type<T[number]> & {
	enum: T
}
export const tEnum = Typem.defineComplexType(<T extends Enum>(self: tEnum<T>, ...values: T) => {
	self.enum = values
	return (value) => {
		if (!values.includes(value as never)) throw new Typem.Error(`Expected one of [${values.join(", ")}], got ${got(value)}`)
	}
})

export type Literal = {} | null | undefined
export type tLiteral<T extends Literal> = Typem.Type<T> & {
	literal: T
}
export const tLiteral = Typem.defineComplexType(<T extends Literal>(self: tLiteral<T>, literal: T) => {
	self.literal = literal
	return (value: unknown) => {
		if (value !== literal) throw new Typem.Error(`Expected literal ${literal?.toString()}, got ${got(value)}`)
	}
})

// VALIDATION TYPES
export const vGt = Typem.defineValidator(<T extends number | bigint>(value: T, gt: T) => {
	if (value <= gt) throw new Typem.Error(`Expected ${got(value)} to be greater than ${gt}`)
})
export const vGte = Typem.defineValidator(<T extends number | bigint>(value: T, gte: T) => {
	if (value < gte) throw new Typem.Error(`Expected ${got(value)} to be greater than or equal to ${gte}`)
})
export const vLt = Typem.defineValidator(<T extends number | bigint>(value: T, lt: T) => {
	if (value >= lt) throw new Typem.Error(`Expected ${got(value)} to be less than ${lt}`)
})
export const vLte = Typem.defineValidator(<T extends number | bigint>(value: T, lte: T) => {
	if (value > lte) throw new Typem.Error(`Expected ${got(value)} to be less than or equal to ${lte}`)
})
export const vRange = Typem.defineValidator(<T extends number | bigint>(value: T, min: T, max: T) => {
	if (value < min || value > max) throw new Typem.Error(`Expected ${got(value)} to be between ${min} and ${max}`)
})
export const vFinite = Typem.defineValidator(<T extends number>(value: T) => {
	if (!Number.isFinite(value)) throw new Typem.Error(`Expected ${got(value)} to be finite`)
})

export const vLength = Typem.defineValidator(<T extends string | Array<any>>(value: T, length: number) => {
	if (value.length !== length) throw new Typem.Error(`Expected ${got(value)} to have length ${length}`)
})
export const vMinLength = Typem.defineValidator(<T extends string | Array<any>>(value: T, minLength: number) => {
	if (value.length < minLength) throw new Typem.Error(`Expected ${got(value)} to have length at least ${minLength}`)
})
export const vMaxLength = Typem.defineValidator(<T extends string | Array<any>>(value: T, maxLength: number) => {
	if (value.length > maxLength) throw new Typem.Error(`Expected ${got(value)} to have length at most ${maxLength}`)
})
export const vLengthRange = Typem.defineValidator(<T extends string | Array<any>>(value: T, minLength: number, maxLength: number) => {
	if (value.length < minLength || value.length > maxLength)
		throw new Typem.Error(`Expected ${got(value)} to have length between ${minLength} and ${maxLength}`)
})

export const vStartsWith = Typem.defineValidator(<T extends string, P extends string>(value: T, prefix: P) => {
	if (!value.startsWith(prefix)) throw new Typem.Error(`Expected ${got(value)} to start with ${prefix}`)
})
export const vEndsWith = Typem.defineValidator(<T extends string, S extends string>(value: T, suffix: S) => {
	if (!value.endsWith(suffix)) throw new Typem.Error(`Expected ${got(value)} to end with ${suffix}`)
})
export const vContains = Typem.defineValidator(<T extends string, S extends string>(value: T, substring: S) => {
	if (!value.includes(substring)) throw new Typem.Error(`Expected ${got(value)} to contain ${substring}`)
})

export const vRegex = Typem.defineValidator(<T extends string>(value: T, regex: RegExp) => {
	if (!regex.test(value)) throw new Typem.Error(`Expected ${got(value)} to match ${regex}`)
})
export const vEmail = () =>
	vRegex(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/)
export const vUrl = () => vRegex(/^(https?:\/\/)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+/)
export const vUri = () => vRegex(/^[a-zA-Z][a-zA-Z0-9+.-]*:/)
export const vDateISO = () => vRegex(/^\d{4}-\d{2}-\d{2}$/)
export const vTimeISO = () => vRegex(/^\d{2}:\d{2}:\d{2}$/)
export const vDateTimeISO = () => vRegex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
