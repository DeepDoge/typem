export namespace ms
{
    type Obj = { [key: string]: unknown }
    type Any = string | number | boolean | null | undefined | object | symbol | bigint
    type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

    export interface ValidatorFunction<T> 
    {
        (value: unknown): asserts value is T
    }
    export interface Validator<T> extends ValidatorFunction<T> 
    {
        is(value: unknown): value is T
        parse(value: unknown): T
    }

    export function createValidator<T>(validator: ValidatorFunction<T>): Validator<T>
    {
        const fn = validator as Validator<T>
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
        return fn
    }

    export const string = createValidator<string>((value: unknown) =>
    {
        if (typeof value !== 'string') throw new TypeError(`Expected string, got ${typeof value}`)
    })
    export const number = createValidator<number>((value: unknown) =>
    {
        if (typeof value !== 'number') throw new TypeError(`Expected number, got ${typeof value}`)
    })
    export const boolean = createValidator<boolean>((value: unknown) =>
    {
        if (typeof value !== 'boolean') throw new TypeError(`Expected boolean, got ${typeof value}`)
    })
    export const symbol = createValidator<symbol>((value: unknown) =>
    {
        if (typeof value !== 'symbol') throw new TypeError(`Expected symbol, got ${typeof value}`)
    })
    export const bigint = createValidator<bigint>((value: unknown) =>
    {
        if (typeof value !== 'bigint') throw new TypeError(`Expected bigint, got ${typeof value}`)
    })

    export const nullable = <T extends Validator<any>>(validator: T) => createValidator<ms.infer<T> | null>((value: unknown) =>
    {
        if (value === null) return
        validator(value)
    })
    export const undefinedable = <T extends Validator<any>>(validator: T) => createValidator<ms.infer<T> | undefined>((value: unknown) =>
    {
        if (value === undefined) return
        validator(value)
    })

    export const object = <T extends Obj>(obj: T) => createValidator<{ [K in keyof T]: ms.infer<T[K]> }>((value: unknown) =>
    {
        if (typeof value !== 'object' || value === null) throw new TypeError(`Expected object, got ${typeof value}`)
        for (const key in obj)
        {
            if (obj.hasOwnProperty(key))
            {
                const validator: any = obj[key]
                validator((value as any)[key])
            }
        }
    })
    export const array = <T extends Validator<any>>(validator: T) => createValidator<ms.infer<T>[]>((value: unknown) =>
    {
        if (!Array.isArray(value)) throw new TypeError(`Expected array, got ${typeof value}`)
        for (const item of value) validator(item)
    })

    export const literal = <T extends Any>(value: T) => createValidator<T>((v: unknown) =>
    {
        if (v !== value) throw new TypeError(`Expected ${value?.toString()}, got ${v}`)
    })
    export const oneOf = <T extends Any>(...values: T[]) => createValidator<T>((value: unknown) =>
    {
        for (const v of values)
        {
            if (v === value) return
        }
        throw new TypeError(`Expected one of ${values.map(v => v?.toString()).join(', ')}, got ${value}`)
    })

    export const union = <T extends Validator<any>[]>(...validators: T) => createValidator<ms.infer<T[number]>>((value: unknown) =>
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
    export const intersection = <T extends Validator<any>[]>(...validators: T) => createValidator<UnionToIntersection<ms.infer<T[number]>>>((value: unknown) =>
    {
        for (const validator of validators) validator(value)
    })


    export const min = <T extends Validator<any>>(validator: T, min: number) => createValidator<ms.infer<T>>((value: unknown) =>
    {
        validator(value)
        if (value < min) throw new TypeError(`Expected ${min} or more, got ${value}`)
    })
    export const max = <T extends Validator<any>>(validator: T, max: number) => createValidator<ms.infer<T>>((value: unknown) =>
    {
        validator(value)
        if (value > max) throw new TypeError(`Expected ${max} or less, got ${value}`)
    })
    export const range = <T extends Validator<any>>(validator: T, min: number, max: number) => createValidator<ms.infer<T>>((value: unknown) =>
    {
        validator(value)
        if (value < min) throw new TypeError(`Expected ${min} or more, got ${value}`)
        if (value > max) throw new TypeError(`Expected ${max} or less, got ${value}`)
    })

    export const length = <T extends Validator<any>>(validator: T, length: number) => createValidator<ms.infer<T>>((value: unknown) =>
    {
        validator(value)
        if (value.length !== length) throw new TypeError(`Expected length of ${length}, got ${value.length}`)
    })
    export const minLength = <T extends Validator<any>>(validator: T, min: number) => createValidator<ms.infer<T>>((value: unknown) =>
    {
        validator(value)
        if (value.length < min) throw new TypeError(`Expected length of ${min} or more, got ${value.length}`)
    })
    export const maxLength = <T extends Validator<any>>(validator: T, max: number) => createValidator<ms.infer<T>>((value: unknown) =>
    {
        validator(value)
        if (value.length > max) throw new TypeError(`Expected length of ${max} or less, got ${value.length}`)
    })
    export const rangeLength = <T extends Validator<any>>(validator: T, min: number, max: number) => createValidator<ms.infer<T>>((value: unknown) =>
    {
        validator(value)
        if (value.length < min) throw new TypeError(`Expected length of ${min} or more, got ${value.length}`)
        if (value.length > max) throw new TypeError(`Expected length of ${max} or less, got ${value.length}`)
    })

    export const pattern = <T extends Validator<any>>(validator: T, pattern: RegExp) => createValidator<ms.infer<T>>((value: unknown) =>
    {
        validator(value)
        if (!pattern.test(value)) throw new TypeError(`Expected pattern of ${pattern}, got ${value}`)
    })

    export type infer<T> = T extends Validator<infer U> ? U : never

    const test = object({
        0: oneOf("a", "b", "c"),
        1: oneOf(1, 2, 3),
        2: union(literal("a"), literal("b"), literal("c"), literal(1), literal(2), literal(3)),
        3: literal("a"),
        4: oneOf<number>(1, 3, 5),

        a: nullable(string),
        b: min(number, 0),
        c: nullable(min(number, 0)),
        d: union(string, number),
        e: intersection(object({ a: number }), object({ b: string })),
        f: array(string),
        g: array(nullable(string)),
        h: array(nullable(min(number, 0))),
    })

    const testValue = test.parse(null)
}