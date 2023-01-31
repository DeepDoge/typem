export type Obj = { [key: string]: unknown };
export type Any = string | number | boolean | null | undefined | object | symbol | bigint;
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

interface Validator<T>
{
    (value: unknown): value is T
}
type TypeOfValidator<T extends Validator<any>> = T extends Validator<infer U> ? U : never


function string(value: unknown): value is string
{
    return typeof value === "string"
}

function number(value: unknown): value is number
{
    return typeof value === "number"
}

function boolean(value: unknown): value is boolean
{
    return typeof value === "boolean"
}

function nullable<T>(validator: Validator<T>): Validator<T | null>
{
    return (value: unknown): value is T | null => value === null || validator(value)
}

function object<T extends Obj>(validators: { [K in keyof T]: Validator<T[K]> }): Validator<T>
{
    return (value: unknown): value is T =>
    {
        if (typeof value !== "object" || value === null) return false

        for (const key in validators)
        {
            if (!validators[key]((value as any)[key])) return false
        }

        return true
    }
}

function array<T>(validator: Validator<T>): Validator<T[]>
{
    return (value: unknown): value is T[] =>
    {
        if (!Array.isArray(value)) return false

        for (const item of value)
        {
            if (!validator(item)) return false
        }

        return true
    }
}

function union<T extends Validator<any>[]>(...validators: T): Validator<TypeOfValidator<T[number]>>
{
    return (value: unknown): value is TypeOfValidator<T[number]> =>
    {
        for (const validator of validators)
        {
            if (validator(value)) return true
        }

        return false
    }
}

function intersection<T extends Validator<any>[]>(...validators: T): Validator<UnionToIntersection<TypeOfValidator<T[number]>>>
{
    return (value: unknown): value is UnionToIntersection<TypeOfValidator<T[number]>> =>
    {
        for (const validator of validators)
        {
            if (!validator(value)) return false
        }

        return true
    }
}

function min<T extends number>(validator: Validator<T>, min: T): Validator<T>
{
    return (value: unknown): value is T => validator(value) && value >= min
}

function max<T extends number>(validator: Validator<T>, max: T): Validator<T>
{
    return (value: unknown): value is T => validator(value) && value <= max
}

function range<T extends number>(validator: Validator<T>, min: T, max: T): Validator<T>
{
    return (value: unknown): value is T => validator(value) && value >= min && value <= max
}

function minLength<T extends string>(validator: Validator<T>, min: number): Validator<T>
{
    return (value: unknown): value is T => validator(value) && value.length >= min
}

function maxLength<T extends string>(validator: Validator<T>, max: number): Validator<T>
{
    return (value: unknown): value is T => validator(value) && value.length <= max
}

function lengthRange<T extends string>(validator: Validator<T>, min: number, max: number): Validator<T>
{
    return (value: unknown): value is T => validator(value) && value.length >= min && value.length <= max
}

function length<T extends string>(validator: Validator<T>, length: number): Validator<T>
{
    return (value: unknown): value is T => validator(value) && value.length === length
}

// TODO: waiting for TS update for <const T>
function literal<T extends Any>(value: T): Validator<T>
{
    return (v: unknown): v is T => v === value
}

function oneOf<T extends Any>(...values: readonly T[]): Validator<T>
{
    return (value: unknown): value is T =>
    {
        for (const v of values)
            if (v === value) return true
        return false
    }
}

function parse<T>(validator: Validator<T>, value: T): T
{
    if (validator(value)) return value

    throw new Error("Invalid value")
}

function parseUnknown<T>(validator: Validator<T>, value: unknown): T
{
    return parse(validator, value as T)
}

const a = nullable(string)
const b = object({
    0: oneOf("a", "b", "c"),
    1: oneOf(1, 2, 3),
    2: union(literal("a"), literal("b"), literal("c"), literal(1), literal(2), literal(3)),
    3: literal("a"),

    a: nullable(string),
    b: min(number, 0),
    c: nullable(min(number, 0)),
    d: union(string, number),
    e: intersection(object({ a: number }), object({ b: string })),
    f: array(string),
    g: array(nullable(string)),
    h: array(nullable(min(number, 0))),
})

type inferType<T extends Validator<any>> = T extends Validator<infer U> ? U : never
type X = inferType<typeof b>