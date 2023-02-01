type Obj = { [key: string]: unknown }
type Any = string | number | boolean | null | undefined | object | symbol | bigint
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

interface ValidatorFunction<T> 
{
    (value: unknown): asserts value is T
}


export namespace mv
{
    export interface Validator<T> extends ValidatorFunction<T> 
    {
        is(value: unknown): value is T
        parse(value: unknown): T
        typecheck(value: T): T
    }

    export type infer<T> = T extends Validator<infer U> ? U : never
}

export const t = (() =>
{
    function createValidator<T>(validator: ValidatorFunction<T>): mv.Validator<T>
    {
        const fn = validator as mv.Validator<T>
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
        fn.typecheck = (value: T): T => value
        return fn
    }

    const string = createValidator<string>((value: unknown) =>
    {
        if (typeof value !== 'string') throw new TypeError(`Expected string, got ${typeof value}`)
    })
    const number = createValidator<number>((value: unknown) =>
    {
        if (typeof value !== 'number') throw new TypeError(`Expected number, got ${typeof value}`)
    })
    const boolean = createValidator<boolean>((value: unknown) =>
    {
        if (typeof value !== 'boolean') throw new TypeError(`Expected boolean, got ${typeof value}`)
    })
    const symbol = createValidator<symbol>((value: unknown) =>
    {
        if (typeof value !== 'symbol') throw new TypeError(`Expected symbol, got ${typeof value}`)
    })
    const bigint = createValidator<bigint>((value: unknown) =>
    {
        if (typeof value !== 'bigint') throw new TypeError(`Expected bigint, got ${typeof value}`)
    })
    const date = createValidator<Date>((value: unknown) =>
    {
        if (!(value instanceof Date)) throw new TypeError(`Expected Date, got ${typeof value}`)
    })
    const function_ = createValidator<Function>((value: unknown) =>
    {
        if (typeof value !== 'function') throw new TypeError(`Expected function, got ${typeof value}`)
    })
    const null_ = createValidator<null>((value: unknown) =>
    {
        if (value !== null) throw new TypeError(`Expected null, got ${typeof value}`)
    })
    const undefined_ = createValidator<undefined>((value: unknown) =>
    {
        if (value !== undefined) throw new TypeError(`Expected undefined, got ${typeof value}`)
    })
    const never = createValidator<never>((value: unknown) =>
    {
        throw new TypeError(`Expected never, got ${typeof value}`)
    })
    const any = createValidator<any>((_: unknown) => { })

    const partial = <T extends Obj>(obj: T) =>
        createValidator<Partial<{ [K in keyof T]: mv.infer<T[K]> }>>((value: unknown) =>
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

    const object = <T extends Obj>(obj: T) =>
        createValidator<{ [K in keyof T]: mv.infer<T[K]> }>((value: unknown) =>
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
    const array = <T extends mv.Validator<any>>(validator: T) =>
        createValidator<mv.infer<T>[]>((value: unknown) =>
        {
            if (!Array.isArray(value)) throw new TypeError(`Expected array, got ${typeof value}`)
            for (const item of value) validator(item)
        })
    const tuple = <T extends mv.Validator<any>[]>(...validators: T) =>
        createValidator<{ [K in keyof T]: mv.infer<T[K]> }>((value: unknown) =>
        {
            if (!Array.isArray(value)) throw new TypeError(`Expected array, got ${typeof value}`)
            if (value.length !== validators.length) throw new TypeError(`Expected array of length ${validators.length}, got ${value.length}`)
            for (let i = 0; i < validators.length; i++)
            {
                const validator = validators[i]
                validator?.(value[i])
            }
        })

    const literal = <T extends Any>(value: T) =>
        createValidator<T>((v: unknown) =>
        {
            if (v !== value) throw new TypeError(`Expected ${value?.toString()}, got ${v}`)
        })
    const oneOf = <T extends Any>(...values: T[]) =>
        createValidator<T>((value: unknown) =>
        {
            for (const v of values)
            {
                if (v === value) return
            }
            throw new TypeError(`Expected one of ${values.map(v => v?.toString()).join(', ')}, got ${value}`)
        })

    const union = <T extends mv.Validator<any>[]>(...validators: T) =>
        createValidator<mv.infer<T[number]>>((value: unknown) =>
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

    const intersection = <T extends mv.Validator<any>[]>(...validators: T) =>
        createValidator<UnionToIntersection<mv.infer<T[number]>>>((value: unknown) =>
        {
            for (const validator of validators) validator(value)
        })

    const not = <T extends mv.Validator<any>>(validator: T) =>
        createValidator<Exclude<mv.infer<T>, null | undefined>>((value: unknown) =>
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

    const gt = <T extends mv.Validator<number | bigint>>(validator: T, min: number | bigint) =>
        createValidator<mv.infer<T>>((value: unknown) =>
        {
            validator(value)
            if (value <= min) throw new TypeError(`Expected more than ${min}, got ${value}`)
        })
    const gte = <T extends mv.Validator<number | bigint>>(validator: T, min: number | bigint) =>
        createValidator<mv.infer<T>>((value: unknown) =>
        {
            validator(value)
            if (value < min) throw new TypeError(`Expected ${min} or more, got ${value}`)
        })
    const lt = <T extends mv.Validator<number | bigint>>(validator: T, max: number | bigint) =>
        createValidator<mv.infer<T>>((value: unknown) =>
        {
            validator(value)
            if (value >= max) throw new TypeError(`Expected less than ${max}, got ${value}`)
        })
    const lte = <T extends mv.Validator<number | bigint>>(validator: T, max: number | bigint) =>
        createValidator<mv.infer<T>>((value: unknown) =>
        {
            validator(value)
            if (value > max) throw new TypeError(`Expected ${max} or less, got ${value}`)
        })
    const between = <T extends mv.Validator<number | bigint>>(validator: T, min: number | bigint, max: number | bigint) =>
        createValidator<mv.infer<T>>((value: unknown) =>
        {
            validator(value)
            if (value < min) throw new TypeError(`Expected ${min} or more, got ${value}`)
            if (value > max) throw new TypeError(`Expected ${max} or less, got ${value}`)
        })
    const int = <T extends mv.Validator<number>>(validator: T) =>
        createValidator<mv.infer<T>>((value: unknown) =>
        {
            validator(value)
            if (!Number.isInteger(value)) throw new TypeError(`Expected integer, got ${value}`)
        })
    const finite = <T extends mv.Validator<number>>(validator: T) =>
        createValidator<mv.infer<T>>((value: unknown) =>
        {
            validator(value)
            if (!Number.isFinite(value)) throw new TypeError(`Expected finite number, got ${value}`)
        })

    const length = <T extends mv.Validator<string>>(validator: T, length: number) =>
        createValidator<mv.infer<T>>((value: unknown) =>
        {
            validator(value)
            if (value.length !== length) throw new TypeError(`Expected length of ${length}, got ${value.length}`)
        })
    const minLength = <T extends mv.Validator<string>>(validator: T, min: number) =>
        createValidator<mv.infer<T>>((value: unknown) =>
        {
            validator(value)
            if (value.length < min) throw new TypeError(`Expected length of ${min} or more, got ${value.length}`)
        })
    const maxLength = <T extends mv.Validator<string>>(validator: T, max: number) =>
        createValidator<mv.infer<T>>((value: unknown) =>
        {
            validator(value)
            if (value.length > max) throw new TypeError(`Expected length of ${max} or less, got ${value.length}`)
        })
    const rangeLength = <T extends mv.Validator<string>>(validator: T, min: number, max: number) =>
        createValidator<mv.infer<T>>((value: unknown) =>
        {
            validator(value)
            if (value.length < min) throw new TypeError(`Expected length of ${min} or more, got ${value.length}`)
            if (value.length > max) throw new TypeError(`Expected length of ${max} or less, got ${value.length}`)
        })

    const pattern = <T extends mv.Validator<string>>(validator: T, pattern: RegExp) =>
        createValidator<mv.infer<T>>((value: unknown) =>
        {
            validator(value)
            if (!pattern.test(value)) throw new TypeError(`Expected pattern of ${pattern}, got ${value}`)
        })

    const email = <T extends mv.Validator<string>>(validator: T) =>
        createValidator<`${string[0]}${string}@${string[0]}${string}.${string[0]}${string}`>((value: unknown) =>
        {
            validator(value)
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new TypeError(`Expected email, got ${value}`)
        })

    const url = <T extends mv.Validator<string>>(validator: T) =>
        createValidator<`${string[0]}${string}://${string[0]}${string}`>((value: unknown) =>
        {
            validator(value)
            if (!/^[^\s@]+:\/\/[^\s@]+$/.test(value)) throw new TypeError(`Expected url, got ${value}`)
        })

    const startsWith = <T extends mv.Validator<string>, P extends string>(validator: T, prefix: P) =>
        createValidator<`${P}${string}`>((value: unknown) =>
        {
            validator(value)
            if (!value.startsWith(prefix)) throw new TypeError(`Expected starts with ${prefix}, got ${value}`)
        })

    const endsWith = <T extends mv.Validator<string>, S extends string>(validator: T, suffix: S) =>
        createValidator<`${string}${S}`>((value: unknown) =>
        {
            validator(value)
            if (!value.endsWith(suffix)) throw new TypeError(`Expected ends with ${suffix}, got ${value}`)
        })

    const dateISO = <T extends mv.Validator<string>>(validator: T) =>
        createValidator<string>((value: unknown) =>
        {
            validator(value)
            if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|([+-]\d{2}:\d{2})))?$/.test(value)) throw new TypeError(`Expected date ISO, got ${value}`)
        })

    return {
        createValidator,
        string,
        number,
        boolean,
        symbol,
        bigint,
        date,
        function: function_,
        null: null_,
        undefined: undefined_,
        never,
        any,
        partial,
        object,
        array,
        tuple,
        union,
        intersection,
        not,
        literal,
        oneOf,
        gt,
        gte,
        lt,
        lte,
        between,
        int,
        finite,
        length,
        minLength,
        maxLength,
        rangeLength,
        pattern,
        email,
        url,
        startsWith,
        endsWith,
        dateISO,
    }
})()

const test = t.object({
    0: t.oneOf("a", "b", "c"),
    1: t.oneOf(1, 2, 3),
    2: t.union(t.literal("a"), t.literal("b"), t.literal("c"), t.literal(1), t.literal(2), t.literal(3)),
    3: t.literal("a"),
    4: t.oneOf<number>(1, 3, 5),

    a: t.union(t.string, t.null),
    b: t.gte(t.number, 0),
    c: t.union(t.null, t.gte(t.number, 0)),
    d: t.union(t.string, t.number),
    e: t.intersection(t.object({ a: t.number }), t.object({ b: t.string })),
    f: t.array(t.string),
    g: t.array(t.union(t.null, t.string)),
    h: t.array(t.union(t.null, t.gte(t.number, 0))),
})

const testValue = test.parse(null) 