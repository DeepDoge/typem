import { $bigint, $number, $validator, Validator } from "../library"

class MyClass {}
const $myClass = $validator((value: unknown): asserts value is MyClass => {
    if (!(value instanceof MyClass)) throw new Error('Not a MyClass')
})

const $oddNumber = $validator((value: unknown): asserts value is number => {
    if (typeof value !== 'number' || value % 2 === 0) throw new Error('Not an odd number')
})

const $odd = $validator(<T extends number | bigint>(value: unknown, validator: Validator<T>): asserts value is T => {
    validator.assert(value)
    if (typeof value === 'number' && value % 2 === 0) throw new Error('Not an odd number')
    if (typeof value === 'bigint' && value % 2n === 0n) throw new Error('Not an odd number')
})

const $oddNumber = $odd($number())
const $oddBigInt = $odd($bigint())