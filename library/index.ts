type ValidatorObj = { [key: string]: Validator<any> }
type Obj = Record<string, any>
type Any = string | number | boolean | null | undefined | object | symbol | bigint
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never
function is<T>(_: unknown): asserts _ is T { }

/* interface ValidatorPipe<T>
{
    <U extends T>(validator: (t: Validator<T>) => Validator<U>): Validator<U>
} */

export interface Validator<T> /* extends ValidatorPipe<T> */
{
    assert(value: unknown): asserts value is T
    is(value: unknown): value is T
    parse(value: unknown): T
    type(value: T): T
}

export type $infer<T> = T extends Validator<infer U> ? U : never

export function $validator<T, P extends any[]>(parser: (value: unknown, ...params: P) => asserts value is T)
{
    return (...params: P): Validator<T> =>
    {
        const fn: Validator<T> = {} as any/* <U>(validator: (t: Validator<T>) => Validator<U>) => validator(fn) */
        fn.assert = (value: unknown) => parser(value, ...params)
        fn.parse = (value: unknown) =>
        {
            if (fn.is(value)) return value
            throw new TypeError(`Expected ${fn}, got ${value}`)
        }
        fn.is = (value: unknown): value is T =>
        {
            try
            {
                parser(value, ...params)
                return true
            }
            catch
            {
                return false
            }
        }
        fn.type = (value: T): T => value
        return fn
    }
}

export const $string = $validator((value: unknown): asserts value is string =>
{
    if (typeof value !== "string") throw new TypeError(`Expected string, got ${value}`)
})
export const $number = $validator((value: unknown): asserts value is number =>
{
    if (typeof value !== "number") throw new TypeError(`Expected number, got ${value}`)
})
export const $int = $validator((value: unknown): asserts value is number =>
{
    if (!Number.isInteger(value)) throw new TypeError(`Expected integer, got ${value}`)
})
export const $bigint = $validator((value: unknown): asserts value is bigint =>
{
    if (typeof value !== "bigint") throw new TypeError(`Expected bigint, got ${value}`)
})
export const $boolean = $validator((value: unknown): asserts value is boolean =>
{
    if (typeof value !== "boolean") throw new TypeError(`Expected boolean, got ${value}`)
})
export const $symbol = $validator((value: unknown): asserts value is symbol =>
{
    if (typeof value !== "symbol") throw new TypeError(`Expected symbol, got ${value}`)
})
export const $function = $validator((value: unknown): asserts value is Function =>
{
    if (!(value instanceof Function)) throw new TypeError(`Expected function, got ${value}`)
})
export const $date = $validator((value: unknown): asserts value is Date =>
{
    if (!(value instanceof Date)) throw new TypeError(`Expected Date, got ${value}`)
})
export const $null = $validator((value: unknown): asserts value is null =>
{
    if (value !== null) throw new TypeError(`Expected null, got ${value}`)
})
export const $undefined = $validator((value: unknown): asserts value is undefined =>
{
    if (value !== undefined) throw new TypeError(`Expected undefined, got ${value}`)
})
export const $never = $validator((value: unknown): asserts value is never =>
{
    throw new TypeError(`Expected never, got ${value}`)
})
export const $unknown = $validator((_: unknown): asserts _ is unknown => { })
export const $any = $validator((_: unknown): asserts _ is any => { })


export const $literal = $validator(<T extends Any>(v: unknown, value: T): asserts v is T =>
{
    if (v !== value) throw new TypeError(`Expected ${value?.toString()}, got ${v}`)
})

export const $union = $validator(<T extends Validator<any>[]>(value: unknown, ...validators: T): asserts value is $infer<T[number]> =>
{
    for (const validator of validators)
    {
        try
        {
            validator.assert(value)
            return
        }
        catch (error)
        {
            continue
        }
    }
    throw new TypeError(`Expected one of ${validators.map(v => v.toString()).join(', ')}, got ${value}`)
})

export const $intersection = $validator(<T extends Validator<object>[]>(value: unknown, ...validators: T): asserts value is UnionToIntersection<$infer<T[number]>> =>
{
    for (const validator of validators) validator.assert(value)
})

export const $exclude = $validator(<T extends Validator<any>, U extends T[]>(value: unknown, validator: T, ...excluded: U): asserts value is Exclude<$infer<T>, $infer<U[number]>> =>
{
    try
    {
        validator.assert(value)
        for (const ex of excluded) ex.assert(value)
        throw new TypeError(`Expected ${validator}, got ${value}`)
    }
    catch (error)
    {
        return
    }
})

type RequiredKeys<T extends ValidatorObj> = { [k in keyof T]: undefined extends $infer<T[k]> ? never : k }[keyof T]
type PartialKeys<T extends ValidatorObj> = { [k in keyof T]: undefined extends $infer<T[k]> ? k : never }[keyof T]
type ApplyPartial<T extends ValidatorObj> = { [k in RequiredKeys<T>]: $infer<T[k]> } & { [k in PartialKeys<T>]?: $infer<T[k]> }

export const $object = $validator(<T extends ValidatorObj>(value: unknown, obj: T): asserts value is ApplyPartial<T> =>
{
    if (typeof value !== "object" || value === null) throw new TypeError(`Expected object, got ${value}`)
    is<Obj>(value)
    for (const [key, validator] of Object.entries(obj))
        validator.parse(value[key])
})

export const $optional = <T extends Validator<any>>(validator: T) => $union(validator, $undefined(), $null())

export const $array = $validator(<T extends Validator<any>>(value: unknown, validator: T): asserts value is $infer<T>[] =>
{
    if (!Array.isArray(value)) throw new TypeError(`Expected array, got ${value}`)
    for (const v of value) validator.assert(v)
})

export const $tuple = $validator(<T extends Validator<any>[]>(value: unknown, ...validators: T): asserts value is { [k in keyof T]: $infer<T[k]> } =>
{
    if (!Array.isArray(value)) throw new TypeError(`Expected array, got ${value}`)
    if (value.length !== validators.length) throw new TypeError(`Expected tuple of length ${validators.length}, got ${value}`)
    for (let i = 0; i < validators.length; i++)
        validators[i]!.parse(value[i])
})

export const $record = $validator(<K extends Validator<any>, V extends Validator<any>>(value: unknown, keyValidator: K, valueValidator: V): asserts value is Record<$infer<K>, $infer<V>> =>
{
    if (typeof value !== "object" || value === null) throw new TypeError(`Expected object, got ${value}`)
    for (const [key, val] of Object.entries(value))
    {
        keyValidator.assert(key)
        valueValidator.assert(val)
    }
})

export const $map = $validator(<K extends Validator<any>, V extends Validator<any>>(value: unknown, keyValidator: K, valueValidator: V): asserts value is Map<$infer<K>, $infer<V>> =>
{
    if (!(value instanceof Map)) throw new TypeError(`Expected Map, got ${value}`)
    for (const [key, val] of value)
    {
        keyValidator.assert(key)
        valueValidator.assert(val)
    }
})

export const $set = $validator(<T extends Validator<any>>(value: unknown, validator: T): asserts value is Set<$infer<T>> =>
{
    if (!(value instanceof Set)) throw new TypeError(`Expected Set, got ${value}`)
    for (const v of value) validator.assert(v)
})

export const $instanceOf = $validator(<T extends new (...args: any[]) => any>(value: unknown, constructor: T): asserts value is InstanceType<T> =>
{
    if (!(value instanceof constructor)) throw new TypeError(`Expected instance of ${constructor.name}, got ${value}`)
})

export const $enum = $validator(<T extends (string | number)[]>(value: unknown, ...values: T): asserts value is T[number] =>
{
    if (!values.includes(value as any)) throw new TypeError(`Expected ${value} to be one of ${values}`)
})


export const $gt = $validator(<T extends number | bigint>(value: unknown, validator: Validator<T>, gt: T): asserts value is T =>
{
    validator.assert(value)
    if (value <= gt) throw new TypeError(`Expected ${value} to be greater than ${gt}`)
})

export const $gte = $validator(<T extends number | bigint>(value: unknown, validator: Validator<T>, gte: T): asserts value is T =>
{
    validator.assert(value)
    if (value < gte) throw new TypeError(`Expected ${value} to be greater than or equal to ${gte}`)
})

export const $lt = $validator(<T extends number | bigint>(value: unknown, validator: Validator<T>, lt: T): asserts value is T =>
{
    validator.assert(value)
    if (value >= lt) throw new TypeError(`Expected ${value} to be less than ${lt}`)
})

export const $lte = $validator(<T extends number | bigint>(value: unknown, validator: Validator<T>, lte: T): asserts value is T =>
{
    validator.assert(value)
    if (value > lte) throw new TypeError(`Expected ${value} to be less than or equal to ${lte}`)
})

export const $range = $validator(<T extends number | bigint>(value: unknown, validator: Validator<T>, min: T, max: T): asserts value is T =>
{
    validator.assert(value)
    if (value < min || value > max) throw new TypeError(`Expected ${value} to be between ${min} and ${max}`)
})

export const $finite = $validator((value: unknown, validator: Validator<number>): asserts value is number =>
{
    validator.assert(value)
    if (!Number.isFinite(value)) throw new TypeError(`Expected ${value} to be finite`)
})

export const $length = $validator(<T extends string | Array<any>>(value: unknown, validator: Validator<T>, length: number): asserts value is T =>
{
    validator.assert(value)
    if (value.length !== length) throw new TypeError(`Expected ${value} to have length ${length}`)
})

export const $minLength = $validator(<T extends string | Array<any>>(value: unknown, validator: Validator<T>, minLength: number): asserts value is T =>
{
    validator.assert(value)
    if (value.length < minLength) throw new TypeError(`Expected ${value} to have length at least ${minLength}`)
})

export const $maxLength = $validator(<T extends string | Array<any>>(value: unknown, validator: Validator<T>, maxLength: number): asserts value is T =>
{
    validator.assert(value)
    if (value.length > maxLength) throw new TypeError(`Expected ${value} to have length at most ${maxLength}`)
})

export const $lengthRange = $validator(<T extends string | Array<any>>(value: unknown, validator: Validator<T>, minLength: number, maxLength: number): asserts value is T =>
{
    validator.assert(value)
    if (value.length < minLength || value.length > maxLength) throw new TypeError(`Expected ${value} to have length between ${minLength} and ${maxLength}`)
})

export const $regex = $validator(<T extends string>(value: unknown, validator: Validator<T>, regex: RegExp): asserts value is T =>
{
    validator.assert(value)
    if (!regex.test(value)) throw new TypeError(`Expected ${value} to match ${regex}`)
})

export const $startsWith = $validator(<T extends string, P extends string>(value: unknown, validator: Validator<T>, prefix: P): 
    asserts value is `${P}${T}` =>
{
    validator.assert(value)
    if (!value.startsWith(prefix)) throw new TypeError(`Expected ${value} to start with ${prefix}`)
})

export const $endsWith = $validator(<T extends string, S extends string>(value: unknown, validator: Validator<T>, suffix: S):
    asserts value is `${T}${S}` =>
{
    validator.assert(value)
    if (!value.endsWith(suffix)) throw new TypeError(`Expected ${value} to end with ${suffix}`)
})

export const $contains = $validator(<T extends string, S extends string>(value: unknown, validator: Validator<T>, substring: S):
    asserts value is `${T}${S}${T}` =>
{
    validator.assert(value)
    if (!value.includes(substring)) throw new TypeError(`Expected ${value} to contain ${substring}`)
})

export const $email = $validator(<T extends string>(value: unknown, validator: Validator<T>):
    asserts value is `${string[0]}${string}@${string[0]}${string}.${string[0]}${string}` =>
{
    validator.assert(value)
    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value))
        throw new TypeError(`Expected ${value} to be a valid email address`)
})

export const $url = $validator(<T extends string>(value: unknown, validator: Validator<T>):
    asserts value is `${'https' | 'http'}://${string[0]}${string}.${string[0]}${string}` =>
{
    validator.assert(value)
    if (!/^(https?:\/\/)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+/.test(value)) throw new TypeError(`Expected ${value} to be a valid URL`)
})

export const $uri = $validator(<T extends string>(value: unknown, validator: Validator<T>):
    asserts value is `${string[0]}${string}://${string[0]}${string}` =>
{
    validator.assert(value)
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) throw new TypeError(`Expected ${value} to be a valid URI`)
})

export const $dateISO = $validator(<T extends string>(value: unknown, validator: Validator<T>):
    asserts value is `${number}-${number}-${number}` =>
{
    validator.assert(value)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new TypeError(`Expected ${value} to be a valid ISO date`)
})

export const $timeISO = $validator(<T extends string>(value: unknown, validator: Validator<T>):
    asserts value is `${number}:${number}:${number}` =>
{
    validator.assert(value)
    if (!/^\d{2}:\d{2}:\d{2}$/.test(value)) throw new TypeError(`Expected ${value} to be a valid ISO time`)
})

export const $dateTimeISO = $validator(<T extends string>(value: unknown, validator: Validator<T>):
    asserts value is `${number}-${number}-${number}T${number}:${number}:${number}` =>
{
    validator.assert(value)
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) throw new TypeError(`Expected ${value} to be a valid ISO date-time`)
})
