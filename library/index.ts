export namespace Typem {
	export class Error extends TypeError {}

	export type Validator<TIn, TOut, TArgs extends [any] | []> = (value: TIn, ...args: TArgs) => TOut

	export type Type<TIn, TOut> = {
		t<UOut, UArgs extends [any] | []>(validator: Validator<TOut, UOut, UArgs>, ...args: UArgs): Type<TIn, UOut>
		returnOrThrow(value: TIn): TOut
	}

	export type Infer<T extends Type<any, any>> = T extends Type<any, infer U> ? U : never
}

function got(value: unknown) {
	return `${value}` ? `${typeof value}: ${value}` : typeof value
}

export function t<TOut, TArgs extends [any] | []>(validator: Typem.Validator<unknown, TOut, TArgs>, ...args: TArgs) {
	const type: Typem.Type<unknown, TOut> = {
		t(validator, ...args) {
			return t((value) => validator(type.returnOrThrow(value), ...args))
		},
		returnOrThrow(value) {
			return validator(value, ...args)
		},
	}

	return type
}

export function t_string(value: unknown): string {
	if (typeof value !== "string") throw new Typem.Error(`Expected string, got ${got(value)}`)
	return value
}

export function t_number(value: unknown): number {
	if (typeof value !== "number") throw new Typem.Error(`Expected number, got ${got(value)}`)
	return value
}

export function t_bigint(value: unknown): bigint {
	if (typeof value !== "bigint") throw new Typem.Error(`Expected bigint, got ${got(value)}`)
	return value
}

export function t_symbol(value: unknown): symbol {
	if (typeof value !== "symbol") throw new Typem.Error(`Expected symbol, got ${got(value)}`)
	return value
}

export function t_function<T extends (...args: any[]) => any>(value: unknown): T {
	if (typeof value !== "function") throw new Typem.Error(`Expected function, got ${got(value)}`)
	return value as T
}

export function t_integer(value: unknown): number {
	if (typeof value !== "number" || !Number.isInteger(value)) throw new Typem.Error(`Expected integer, got ${got(value)}`)
	return value
}

export function t_gt<T extends number | bigint>(value: T, gt: T): T {
	if (value <= gt) throw new Typem.Error(`Expected number greater than ${gt}, got ${got(value)}`)
	return value
}

export function t_gte<T extends number | bigint>(value: T, gte: T): T {
	if (value < gte) throw new Typem.Error(`Expected number greater than or equal to ${gte}, got ${got(value)}`)
	return value
}

export function t_lt<T extends number | bigint>(value: T, lt: T): T {
	if (value >= lt) throw new Typem.Error(`Expected number less than ${lt}, got ${got(value)}`)
	return value
}

export function t_lte<T extends number | bigint>(value: T, lte: T): T {
	if (value > lte) throw new Typem.Error(`Expected number less than or equal to ${lte}, got ${got(value)}`)
	return value
}

export function t_length<T extends { length: number }>(value: T, length: number): T {
	if (value.length !== length) throw new Typem.Error(`Expected length ${length}, got ${got(value)}`)
	return value
}

export function t_minLength<T extends { length: number }>(value: T, minLength: number): T {
	if (value.length < minLength) throw new Typem.Error(`Expected minimum length ${minLength}, got ${got(value)}`)
	return value
}

export function t_maxLength<T extends { length: number }>(value: T, maxLength: number): T {
	if (value.length > maxLength) throw new Typem.Error(`Expected maximum length ${maxLength}, got ${got(value)}`)
	return value
}

export function t_boolean(value: unknown): boolean {
	if (typeof value !== "boolean") throw new Typem.Error(`Expected boolean, got ${got(value)}`)
	return value
}

export function t_null(value: unknown): null {
	if (value !== null) throw new Typem.Error(`Expected null, got ${got(value)}`)
	return value
}

export function t_undefined(value: unknown): undefined {
	if (value !== undefined) throw new Typem.Error(`Expected undefined, got ${got(value)}`)
	return value
}

export function t_unknown(value: unknown): unknown {
	return value
}

export function t_oneOf<T extends unknown[]>(value: unknown, values: T): T[number] {
	if (!values.includes(value)) throw new Typem.Error(`Expected one of ${values}, got ${got(value)}`)
	return value as T[number]
}

export function t_regex(value: string, regex: RegExp): string {
	if (!regex.test(value)) throw new Typem.Error(`Expected string matching ${regex}, got ${got(value)}`)
	return value
}

export function t_email(value: string): string {
	return t_regex(value, /^[^@]+@[^@]+\.[^@]+$/)
}

export function t_url(value: string): string {
	return t_regex(value, /^(?:[a-z]+:)?\/\//i)
}

export function t_literal<T extends {} | null | undefined>(value: unknown, literal: T): T {
	if (value !== literal) throw new Typem.Error(`Expected literal ${literal}, got ${got(value)}`)
	return value as T
}

export function t_instanceof<T extends new (...args: any[]) => any>(value: unknown, constructor: T): InstanceType<T> {
	if (!(value instanceof constructor)) throw new Typem.Error(`Expected instance of ${constructor.name}, got ${got(value)}`)
	return value
}

export function t_array<T>(value: unknown, type: Typem.Type<unknown, T>): T[] {
	if (!Array.isArray(value)) throw new Typem.Error(`Expected array, got ${got(value)}`)
	return value.map((v) => type.returnOrThrow(v))
}

export function t_object<TSchema extends Record<PropertyKey, Typem.Type<unknown, any>>>(
	value: unknown,
	schema: TSchema
): {
	[K in { [K2 in keyof TSchema]: undefined extends Typem.Infer<TSchema[K2]> ? never : K2 }[keyof TSchema]]: Typem.Infer<TSchema[K]>
} & {
	[K in { [K2 in keyof TSchema]: undefined extends Typem.Infer<TSchema[K2]> ? K2 : never }[keyof TSchema]]?: Typem.Infer<TSchema[K]>
} {
	if (typeof value !== "object" || value === null) throw new Typem.Error(`Expected object, got ${got(value)}`)
	for (const [key, type] of Object.entries(schema)) {
		try {
			type.returnOrThrow(value[key as keyof typeof value])
		} catch (error) {
			if (error instanceof Typem.Error) throw new Typem.Error(`${key}: ${error.message}`)
			throw error
		}
	}
	return value as any
}

export function t_union<T extends Typem.Type<unknown, any>[]>(value: unknown, types: T): ReturnType<T[number]["returnOrThrow"]> {
	for (const type of types) {
		try {
			return type.returnOrThrow(value)
		} catch (error) {
			const message = error instanceof Typem.Error ? error.message : `${error}`
			throw new Typem.Error(`Union validation failed: ${message}`)
		}
	}
	throw new Typem.Error(`Union validation failed: no types matched`)
}

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never
export function t_intersection<T extends Typem.Type<unknown, any>[]>(
	value: unknown,
	types: T
): UnionToIntersection<ReturnType<T[number]["returnOrThrow"]>> {
	for (const type of types) {
		try {
			value = type.returnOrThrow(value)
		} catch (error) {
			const message = error instanceof Typem.Error ? error.message : `${error}`
			throw new Typem.Error(`Intersection validation failed: ${message}`)
		}
	}
	return value as any
}

export function t_tuple<T extends Typem.Type<unknown, any>[]>(value: unknown, types: T): { [K in keyof T]: ReturnType<T[K]["returnOrThrow"]> } {
	if (!Array.isArray(value)) throw new Typem.Error(`Expected tuple, got ${got(value)}`)
	if (value.length !== types.length) throw new Typem.Error(`Expected tuple of length ${types.length}, got ${value.length}`)

	const result: any = []
	for (let i = 0; i < types.length; i++) {
		try {
			result[i] = types[i]!.returnOrThrow(value[i])
		} catch (error) {
			const message = error instanceof Typem.Error ? error.message : `${error}`
			throw new Typem.Error(`Tuple validation failed for index ${i}: ${message}`)
		}
	}
	return result
}

export function t_record<T extends Typem.Type<unknown, any>>(value: unknown, type: T): { [key: string]: ReturnType<T["returnOrThrow"]> } {
	if (typeof value !== "object" || value === null) throw new Typem.Error(`Expected object, got ${got(value)}`)

	const result: any = {}
	for (const key in value) {
		try {
			result[key] = type.returnOrThrow((value as any)[key])
		} catch (error) {
			const message = error instanceof Typem.Error ? error.message : `${error}`
			throw new Typem.Error(`Record validation failed for key ${key}: ${message}`)
		}
	}
	return result
}

export function t_map<T extends Typem.Type<unknown, any>>(value: unknown, type: T): Map<string, ReturnType<T["returnOrThrow"]>> {
	if (typeof value !== "object" || value === null) throw new Typem.Error(`Expected object, got ${got(value)}`)

	const result = new Map<string, any>()
	for (const key in value) {
		try {
			result.set(key, type.returnOrThrow((value as any)[key]))
		} catch (error) {
			const message = error instanceof Typem.Error ? error.message : `${error}`
			throw new Typem.Error(`Map validation failed for key ${key}: ${message}`)
		}
	}
	return result
}

export function t_set<T extends Typem.Type<unknown, any>>(value: unknown, type: T): Set<ReturnType<T["returnOrThrow"]>> {
	if (!Array.isArray(value)) throw new Typem.Error(`Expected array, got ${got(value)}`)

	const result = new Set<any>()
	for (const item of value) {
		try {
			result.add(type.returnOrThrow(item))
		} catch (error) {
			const message = error instanceof Typem.Error ? error.message : `${error}`
			throw new Typem.Error(`Set validation failed: ${message}`)
		}
	}
	return result
}
