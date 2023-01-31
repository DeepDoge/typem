export type Obj = { [key: string]: unknown };
export type Any = string | number | boolean | null | undefined | object | symbol | bigint;
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

interface ValidatorFunction<T> 
{
    (value: unknown): value is T;
}
interface Validator<T> extends ValidatorFunction<T> 
{
    error: (value: unknown) => string;
}
type TypeOfValidator<T extends Validator<any>> = T extends Validator<infer U> ? U : never

function createValidator<T>(validator: ValidatorFunction<T>, error: (value: unknown) => string): Validator<T>
{
    const v = validator as Validator<T>
    v.error = error
    return v
}

const string = createValidator((value: unknown): value is string => typeof value === "string", (value: unknown) => `Expected string, got ${typeof value}`)
const number = createValidator((value: unknown): value is number => typeof value === "number", (value: unknown) => `Expected number, got ${typeof value}`)
const boolean = createValidator((value: unknown): value is boolean => typeof value === "boolean", (value: unknown) => `Expected boolean, got ${typeof value}`)
const symbol = createValidator((value: unknown): value is symbol => typeof value === "symbol", (value: unknown) => `Expected symbol, got ${typeof value}`)
const bigint = createValidator((value: unknown): value is bigint => typeof value === "bigint", (value: unknown) => `Expected bigint, got ${typeof value}`)

const nullable = <T extends Validator<any>>(validator: T) => createValidator((value: unknown): value is TypeOfValidator<T> | null => value === null || validator(value), (value: unknown) => `Expected null or ${validator.error(value)}, got ${typeof value}`)
const undefinable = <T extends Validator<any>>(validator: T) => createValidator((value: unknown): value is TypeOfValidator<T> | undefined => value === undefined || validator(value), (value: unknown) => `Expected undefined or ${validator.error(value)}, got ${typeof value}`)

const literal = <T extends Any>(value: T) => createValidator((v: unknown): v is T => v === value, (v: unknown) => `Expected ${value?.toString()}, got ${v?.toString()}`)
const oneOf = <T extends Any>(...values: T[]) => createValidator((value: unknown): value is T => values.includes(value as T), (value: unknown) => `Expected one of ${values.map(v => v?.toString()).join(", ")}, got ${value?.toString()}`)

const object = <T extends Obj>(validators: { [K in keyof T]: Validator<T[K]> }) => createValidator((value: unknown): value is T => value !== null && typeof value === "object" && Object.entries(validators).every(([key, validator]) => validator((value as T)[key])), (value: unknown) => `Expected object, got ${typeof value}`)
const array = <T extends Validator<any>>(validator: T) => createValidator((value: unknown): value is TypeOfValidator<T>[] => Array.isArray(value) && value.every(v => validator(v)), (value: unknown) => `Expected array, got ${typeof value}`)

const union = <T extends Validator<any>[]>(...validators: T) => createValidator((value: unknown): value is TypeOfValidator<T[number]> => validators.some(validator => validator(value)), (value: unknown) => `Expected one of ${validators.map(validator => validator.error(value)).join(", ")}, got ${value?.toString()}`)
const intersection = <T extends Validator<any>[]>(...validators: T) => createValidator((value: unknown): value is UnionToIntersection<TypeOfValidator<T[number]>> => validators.every(validator => validator(value)), (value: unknown) => `Expected intersection of ${validators.map(validator => validator.error(value)).join(", ")}, got ${value?.toString()}`)

const min = <T extends Validator<any>>(validator: T, min: number) => createValidator((value: unknown): value is TypeOfValidator<T> => validator(value) && value >= min, (value: unknown) => `Expected ${validator.error(value)} >= ${min}, got ${value}`)
const max = <T extends Validator<any>>(validator: T, max: number) => createValidator((value: unknown): value is TypeOfValidator<T> => validator(value) && value <= max, (value: unknown) => `Expected ${validator.error(value)} <= ${max}, got ${value}`)
const range = <T extends Validator<any>>(validator: T, min: number, max: number) => createValidator((value: unknown): value is TypeOfValidator<T> => validator(value) && value >= min && value <= max, (value: unknown) => `Expected ${validator.error(value)} >= ${min} && <= ${max}, got ${value}`)

const length = <T extends Validator<any>>(validator: T, length: number) => createValidator((value: unknown): value is TypeOfValidator<T> => validator(value) && value.length === length, (value: unknown) => `Expected ${validator.error(value)}.length === ${length}, got ${value}`)
const minLength = <T extends Validator<any>>(validator: T, min: number) => createValidator((value: unknown): value is TypeOfValidator<T> => validator(value) && value.length >= min, (value: unknown) => `Expected ${validator.error(value)}.length >= ${min}, got ${value}`)
const maxLength = <T extends Validator<any>>(validator: T, max: number) => createValidator((value: unknown): value is TypeOfValidator<T> => validator(value) && value.length <= max, (value: unknown) => `Expected ${validator.error(value)}.length <= ${max}, got ${value}`)
const rangeLength = <T extends Validator<any>>(validator: T, min: number, max: number) => createValidator((value: unknown): value is TypeOfValidator<T> => validator(value) && value.length >= min && value.length <= max, (value: unknown) => `Expected ${validator.error(value)}.length >= ${min} && <= ${max}, got ${value}`)

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