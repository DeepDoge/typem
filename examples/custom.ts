import { $bigint, $number, $validator, Validator } from "../library"

class MyClass {}
const $myClass = $validator((value: unknown): asserts value is MyClass => {
    if (!(value instanceof MyClass)) throw new Error('Not a MyClass')
})

const $positiveNumber = $validator((value: unknown): asserts value is number => {
    if (typeof value !== 'number') throw new Error('Not a number')
    if (value <= 0) throw new Error('Not a positive number')
})

// Or you can inhrerit from another validator
const $positive = $validator(<T extends bigint | number>(value: unknown, validator: Validator<T>): asserts value is T => {
    validator.assert(value)
    if (value <= 0) throw new Error('Not a positive number')
}) 

const $positiveBigInt = $positive($bigint())
const $positiveNumber = $positive($number())