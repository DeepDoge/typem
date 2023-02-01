import { $array, $gte, $intersection, $literal, $null, $number, $object, $oneOf, $string, $union } from "../library"

export const test = $object({
    0: $oneOf("a", "b", "c"),
    1: $oneOf(1, 2, 3),
    2: $union($literal("a"), $literal("b"), $literal("c"), $literal(1), $literal(2), $literal(3)),
    3: $literal("a"),
    4: $oneOf<number>(1, 3, 5),

    a: $union($string, $null),
    b: $gte($number, 0),
    c: $union($null, $gte($number, 0)),
    d: $union($string, $number),
    e: $intersection($object({ a: $number }), $object({ b: $string })),
    f: $array($string),
    g: $array($union($null, $string)),
    h: $array($union($null, $gte($number, 0))),
})

export const $testValue = test.parse(null) 