export namespace ms
{
    type Obj = { [key: string]: unknown }
    type Any = string | number | boolean | null | undefined | object | symbol | bigint
    type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never
    export type infer<T extends Validator<any>> = T extends Validator<infer U> ? U : never

    export interface ValidatorFunction<T> 
    {
        (value: unknown): value is T
    }
    export interface Validator<T> extends ValidatorFunction<T> 
    {
        error: (value: unknown) => string
    }
    export type TypeOfValidator<T extends Validator<any>> = T extends Validator<infer U> ? U : never

    export function createValidator<T>(validator: ValidatorFunction<T>, error: (value: unknown) => string): Validator<T>
    {
        const v = validator as Validator<T>
        v.error = error
        return v
    }

    export const string = createValidator((value: unknown): value is string => typeof value === "string", (value: unknown) => `Expected string, got ${typeof value}`)
    export const number = createValidator((value: unknown): value is number => typeof value === "number", (value: unknown) => `Expected number, got ${typeof value}`)
    export const boolean = createValidator((value: unknown): value is boolean => typeof value === "boolean", (value: unknown) => `Expected boolean, got ${typeof value}`)
    export const symbol = createValidator((value: unknown): value is symbol => typeof value === "symbol", (value: unknown) => `Expected symbol, got ${typeof value}`)
    export const bigint = createValidator((value: unknown): value is bigint => typeof value === "bigint", (value: unknown) => `Expected bigint, got ${typeof value}`)

    export const nullable = <T extends Validator<any>>(validator: T) => createValidator((value: unknown): value is TypeOfValidator<T> | null => value === null || validator(value), (value: unknown) => `Expected null or ${validator.error(value)}, got ${typeof value}`)
    export const undefinable = <T extends Validator<any>>(validator: T) => createValidator((value: unknown): value is TypeOfValidator<T> | undefined => value === undefined || validator(value), (value: unknown) => `Expected undefined or ${validator.error(value)}, got ${typeof value}`)

    export const literal = <T extends Any>(value: T) => createValidator((v: unknown): v is T => v === value, (v: unknown) => `Expected ${value?.toString()}, got ${v?.toString()}`)
    export const oneOf = <T extends Any>(...values: T[]) => createValidator((value: unknown): value is T => values.includes(value as T), (value: unknown) => `Expected one of ${values.map(v => v?.toString()).join(", ")}, got ${value?.toString()}`)

    export const object = <T extends Obj>(validators: { [K in keyof T]: Validator<T[K]> }) => createValidator((value: unknown): value is T => value !== null && typeof value === "object" && Object.entries(validators).every(([key, validator]) => validator((value as T)[key])), (value: unknown) => `Expected object, got ${typeof value}`)
    export const array = <T extends Validator<any>>(validator: T) => createValidator((value: unknown): value is TypeOfValidator<T>[] => Array.isArray(value) && value.every(v => validator(v)), (value: unknown) => `Expected array, got ${typeof value}`)

    export const union = <T extends Validator<any>[]>(...validators: T) => createValidator((value: unknown): value is TypeOfValidator<T[number]> => validators.some(validator => validator(value)), (value: unknown) => `Expected one of ${validators.map(validator => validator.error(value)).join(", ")}, got ${value?.toString()}`)
    export const intersection = <T extends Validator<any>[]>(...validators: T) => createValidator((value: unknown): value is UnionToIntersection<TypeOfValidator<T[number]>> => validators.every(validator => validator(value)), (value: unknown) => `Expected intersection of ${validators.map(validator => validator.error(value)).join(", ")}, got ${value?.toString()}`)

    export const min = <T extends Validator<any>>(validator: T, min: number) => createValidator((value: unknown): value is TypeOfValidator<T> => validator(value) && value >= min, (value: unknown) => `Expected ${validator.error(value)} >= ${min}, got ${value}`)
    export const max = <T extends Validator<any>>(validator: T, max: number) => createValidator((value: unknown): value is TypeOfValidator<T> => validator(value) && value <= max, (value: unknown) => `Expected ${validator.error(value)} <= ${max}, got ${value}`)
    export const range = <T extends Validator<any>>(validator: T, min: number, max: number) => createValidator((value: unknown): value is TypeOfValidator<T> => validator(value) && value >= min && value <= max, (value: unknown) => `Expected ${validator.error(value)} >= ${min} && <= ${max}, got ${value}`)

    export const length = <T extends Validator<any>>(validator: T, length: number) => createValidator((value: unknown): value is TypeOfValidator<T> => validator(value) && value.length === length, (value: unknown) => `Expected ${validator.error(value)}.length === ${length}, got ${value}`)
    export const minLength = <T extends Validator<any>>(validator: T, min: number) => createValidator((value: unknown): value is TypeOfValidator<T> => validator(value) && value.length >= min, (value: unknown) => `Expected ${validator.error(value)}.length >= ${min}, got ${value}`)
    export const maxLength = <T extends Validator<any>>(validator: T, max: number) => createValidator((value: unknown): value is TypeOfValidator<T> => validator(value) && value.length <= max, (value: unknown) => `Expected ${validator.error(value)}.length <= ${max}, got ${value}`)
    export const rangeLength = <T extends Validator<any>>(validator: T, min: number, max: number) => createValidator((value: unknown): value is TypeOfValidator<T> => validator(value) && value.length >= min && value.length <= max, (value: unknown) => `Expected ${validator.error(value)}.length >= ${min} && <= ${max}, got ${value}`)

    export function parse<T>(validator: Validator<T>, value: T): T
    {
        if (validator(value)) return value

        throw new Error("Invalid value")
    }

    export function parseUnknown<T>(validator: Validator<T>, value: unknown): T
    {
        return parse(validator, value as T)
    }
}