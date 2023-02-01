type ValidatorObj = { [key: string]: $Validator<any> }
type Any = string | number | boolean | null | undefined | object | symbol | bigint
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

interface ValidatorFunction<T> 
{
    (value: unknown): asserts value is T
}

export interface $Validator<T> extends ValidatorFunction<T> 
{
    is(value: unknown): value is T
    parse(value: unknown): T
    typecheck(value: T): T
}

export type $infer<T> = T extends $Validator<infer U> ? U : never

export function $validator<T>(validator: ValidatorFunction<T>): $Validator<T>
{
    const fn = validator as $Validator<T>
    fn.is = (value: unknown): value is T => 
    {
        try
        {
            validator(value)
            return true
        }
        catch (error)
        {
            return false
        }
    }
    fn.parse = (value: unknown): T =>
    {
        validator(value)
        return value as T
    }
    fn.typecheck = (value: T) => value
    return fn
}

export const $string = $validator<string>((value: unknown) =>
{
    if (typeof value !== 'string') throw new TypeError(`Expected string, got ${typeof value}`)
})
export const $number = $validator<number>((value: unknown) =>
{
    if (typeof value !== 'number') throw new TypeError(`Expected number, got ${typeof value}`)
})
export const $boolean = $validator<boolean>((value: unknown) =>
{
    if (typeof value !== 'boolean') throw new TypeError(`Expected boolean, got ${typeof value}`)
})
export const $symbol = $validator<symbol>((value: unknown) =>
{
    if (typeof value !== 'symbol') throw new TypeError(`Expected symbol, got ${typeof value}`)
})
export const $bigint = $validator<bigint>((value: unknown) =>
{
    if (typeof value !== 'bigint') throw new TypeError(`Expected bigint, got ${typeof value}`)
})
export const $date = $validator<Date>((value: unknown) =>
{
    if (!(value instanceof Date)) throw new TypeError(`Expected Date, got ${typeof value}`)
})
export const $function = $validator<Function>((value: unknown) =>
{
    if (!(value instanceof Function)) throw new TypeError(`Expected function, got ${typeof value}`)
})
export const $null = $validator<null>((value: unknown) =>
{
    if (value !== null) throw new TypeError(`Expected null, got ${typeof value}`)
})
export const $undefined = $validator<undefined>((value: unknown) =>
{
    if (value !== undefined) throw new TypeError(`Expected undefined, got ${typeof value}`)
})
export const $never = $validator<never>((value: unknown) =>
{
    throw new TypeError(`Expected never, got ${typeof value}`)
})
export const $unknown = $validator<unknown>((value: unknown) =>
{
    if (value === undefined) throw new TypeError(`Expected unknown, got undefined`)
})
export const $any = $validator<any>((_: unknown) => { })


export const $literal = <T extends Any>(value: T) =>
    $validator<T>((v: unknown) =>
    {
        if (v !== value) throw new TypeError(`Expected ${value?.toString()}, got ${v}`)
    })
export const $oneOf = <T extends Any[]>(...values: T) =>
    $validator<T[number]>((value: unknown) =>
    {
        for (const v of values)
            if (value === v) return
        throw new TypeError(`Expected one of ${values.map(v => v?.toString()).join(', ')}, got ${value}`)
    })

export const $union = <T extends $Validator<any>[]>(...validators: T) =>
    $validator<$infer<T[number]>>((value: unknown) =>
    {
        for (const validator of validators)
        {
            try
            {
                validator(value)
                return
            }
            catch (error)
            {
                continue
            }
        }
        throw new TypeError(`Expected one of ${validators.map(v => v.name).join(', ')}, got ${value}`)
    })

export const $intersection = <T extends $Validator<any>[]>(...validators: T) =>
    $validator<UnionToIntersection<$infer<T[number]>>>((value: unknown) =>
    {
        for (const validator of validators) validator(value)
    })

export const $not = <T extends $Validator<any>>(validator: T) =>
    $validator<Exclude<$infer<T>, null | undefined>>((value: unknown) =>
    {
        try
        {
            validator(value)
        }
        catch (error)
        {
            return
        }
        throw new TypeError(`Expected not ${validator.name}, got ${value}`)
    })


type RequiredKeys<T extends ValidatorObj> = { [k in keyof T]: undefined extends $infer<T[k]> ? never : k }[keyof T]
type PartialKeys<T extends ValidatorObj> = { [k in keyof T]: undefined extends $infer<T[k]> ? k : never }[keyof T]
type ApplyPartial<T extends ValidatorObj> = { [k in RequiredKeys<T>]: $infer<T[k]> } & { [k in PartialKeys<T>]?: $infer<T[k]> }

export const $object = <T extends ValidatorObj>(obj: T) =>
    $validator<ApplyPartial<T>>((value: unknown) =>
    {
        if (typeof value !== 'object' || value === null) throw new TypeError(`Expected object, got ${typeof value}`)
        for (const [key, validator] of Object.entries(obj))
            validator.parse((value as { [K in keyof T]: $infer<T[K]> })[key])
    })
export const $optional = <T extends Any>(validator: $Validator<T>) => $union($null, $undefined, validator)

export const $array = <T extends $Validator<any>>(validator: T) =>
    $validator<$infer<T>[]>((value: unknown) =>
    {
        if (!Array.isArray(value)) throw new TypeError(`Expected array, got ${typeof value}`)
        for (const item of value) validator(item)
    })
export const $tuple = <T extends $Validator<any>[]>(...validators: T) =>
    $validator<{ [K in keyof T]: $infer<T[K]> }>((value: unknown) =>
    {
        if (!Array.isArray(value)) throw new TypeError(`Expected array, got ${typeof value}`)
        if (value.length !== validators.length) throw new TypeError(`Expected array of length ${validators.length}, got ${value.length}`)
        for (let i = 0; i < validators.length; i++)
        {
            const validator = validators[i]
            validator?.(value[i])
        }
    })


export const $gt = <T extends $Validator<number | bigint>>(validator: T, min: number | bigint) =>
    $validator<$infer<T>>((value: unknown) =>
    {
        validator(value)
        if (value <= min) throw new TypeError(`Expected more than ${min}, got ${value}`)
    })
export const $gte = <T extends $Validator<number | bigint>>(validator: T, min: number | bigint) =>
    $validator<$infer<T>>((value: unknown) =>
    {
        validator(value)
        if (value < min) throw new TypeError(`Expected ${min} or more, got ${value}`)
    })
export const $lt = <T extends $Validator<number | bigint>>(validator: T, max: number | bigint) =>
    $validator<$infer<T>>((value: unknown) =>
    {
        validator(value)
        if (value >= max) throw new TypeError(`Expected less than ${max}, got ${value}`)
    })
export const $lte = <T extends $Validator<number | bigint>>(validator: T, max: number | bigint) =>
    $validator<$infer<T>>((value: unknown) =>
    {
        validator(value)
        if (value > max) throw new TypeError(`Expected ${max} or less, got ${value}`)
    })
export const $between = <T extends $Validator<number | bigint>>(validator: T, min: number | bigint, max: number | bigint) =>
    $validator<$infer<T>>((value: unknown) =>
    {
        validator(value)
        if (value < min) throw new TypeError(`Expected ${min} or more, got ${value}`)
        if (value > max) throw new TypeError(`Expected ${max} or less, got ${value}`)
    })
export const $int = <T extends $Validator<number>>(validator: T) =>
    $validator<$infer<T>>((value: unknown) =>
    {
        validator(value)
        if (!Number.isInteger(value)) throw new TypeError(`Expected integer, got ${value}`)
    })
export const $finite = <T extends $Validator<number>>(validator: T) =>
    $validator<$infer<T>>((value: unknown) =>
    {
        validator(value)
        if (!Number.isFinite(value)) throw new TypeError(`Expected finite number, got ${value}`)
    })

export const $length = <T extends $Validator<string>>(validator: T, length: number) =>
    $validator<$infer<T>>((value: unknown) =>
    {
        validator(value)
        if (value.length !== length) throw new TypeError(`Expected length of ${length}, got ${value.length}`)
    })
export const $minLength = <T extends $Validator<string>>(validator: T, min: number) =>
    $validator<$infer<T>>((value: unknown) =>
    {
        validator(value)
        if (value.length < min) throw new TypeError(`Expected length of ${min} or more, got ${value.length}`)
    })
export const $maxLength = <T extends $Validator<string>>(validator: T, max: number) =>
    $validator<$infer<T>>((value: unknown) =>
    {
        validator(value)
        if (value.length > max) throw new TypeError(`Expected length of ${max} or less, got ${value.length}`)
    })
export const $rangeLength = <T extends $Validator<string>>(validator: T, min: number, max: number) =>
    $validator<$infer<T>>((value: unknown) =>
    {
        validator(value)
        if (value.length < min) throw new TypeError(`Expected length of ${min} or more, got ${value.length}`)
        if (value.length > max) throw new TypeError(`Expected length of ${max} or less, got ${value.length}`)
    })

export const $pattern = <T extends $Validator<string>>(validator: T, pattern: RegExp) =>
    $validator<$infer<T>>((value: unknown) =>
    {
        validator(value)
        if (!pattern.test(value)) throw new TypeError(`Expected pattern of ${pattern}, got ${value}`)
    })

export const $email = <T extends $Validator<string>>(validator: T) =>
    $validator<`${string[0]}${string}@${string[0]}${string}.${string[0]}${string}`>((value: unknown) =>
    {
        validator(value)
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new TypeError(`Expected email, got ${value}`)
    })

export const $url = <T extends $Validator<string>>(validator: T) =>
    $validator<`${string[0]}${string}://${string[0]}${string}`>((value: unknown) =>
    {
        validator(value)
        if (!/^[^\s@]+:\/\/[^\s@]+$/.test(value)) throw new TypeError(`Expected url, got ${value}`)
    })

export const $startsWith = <T extends $Validator<string>, P extends string>(validator: T, prefix: P) =>
    $validator<`${P}${string}`>((value: unknown) =>
    {
        validator(value)
        if (!value.startsWith(prefix)) throw new TypeError(`Expected starts with ${prefix}, got ${value}`)
    })

export const $endsWith = <T extends $Validator<string>, S extends string>(validator: T, suffix: S) =>
    $validator<`${string}${S}`>((value: unknown) =>
    {
        validator(value)
        if (!value.endsWith(suffix)) throw new TypeError(`Expected ends with ${suffix}, got ${value}`)
    })

export const $dateISO = <T extends $Validator<string>>(validator: T) =>
    $validator<string>((value: unknown) =>
    {
        validator(value)
        if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|([+-]\d{2}:\d{2})))?$/.test(value)) throw new TypeError(`Expected date ISO, got ${value}`)
    })