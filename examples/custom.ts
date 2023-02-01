import { $infer, $maxLength, $number, $string, $Validator, $validator } from "../library"

const even = <T extends $Validator<number>>(validator: T) =>
    $validator<$infer<T>>((value: unknown) =>
    {
        validator(value)
        if (value % 2 !== 0) throw new TypeError(`Expected even number, got ${value}`)
    })
const evenNumber = even($number)

class MyClass { }
const myClass = $validator<MyClass>((value: unknown) => 
{
    if (!(value instanceof MyClass)) throw new TypeError(`Expected MyClass, got ${value}`)
})

const email = <T extends $Validator<string>>(validator: T) =>
    $validator<`${string[0]}${string}@${string[0]}${string}.${string[0]}${string}`>((value: unknown) =>
    {
        validator(value)
        if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) throw new TypeError(`Expected email, got ${value}`)
    })

// then you can use it like this
const shortEmail = email($maxLength($string, 50))

shortEmail.parse("foo@bar.baz") // ok
shortEmail.parse("foo@") // throws Error

shortEmail.typecheck("foo@bar.baz") // ok
shortEmail.typecheck("foo@") // TypeScript error