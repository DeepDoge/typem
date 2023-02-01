import { $gt, $gte, $intersection, $literal, $null, $number, $object, $oneOf, $optional, $rangeLength, $string, $union } from "../library"

const $person = $object({
    name: $string($rangeLength(1, 32)),
    age: $union($null, $number($gt(0))),
    sex: $union($literal('man'), $literal('woman')),
    // or you can use `oneOf` instead of `union` and `literal`
    city: $optional($oneOf(
        'Kraków',
        'Oaxaca',
        'Moscow',
        'Kabul',
        'Baghdad',
        'Kuala, Lumpur',
        'Jeddah',
        'Riyadh',
        'Mogadishu',
        'Dubai',
        'Abu Dhabi',
        'Sanaa',
        'Ibadan',
        'Taizz',
        'Tehran'
    ))
})

const $memberRole = $oneOf('admin', 'moderator', 'user')
const $member = $intersection($person, $object({
    id: $string,
    role: $memberRole
}))

$string(minLength(1), maxLength(32))
$union($null, $number($gte(0)))

/* 
    Type of $member:
    {
        name: string
        age: number | null
        sex: 'man' | 'woman'
        city?: 'Kraków' | 'Oaxaca' | 'Moscow' | 'Kabul' | 
            'Baghdad' | 'Kuala, Lumpur' | 'Jeddah' | 'Riyadh' | 'Mogadishu' | 
            'Dubai' | 'Abu Dhabi' | 'Sanaa' | 'Ibadan' | 'Taizz' | 'Tehran' | null | undefined
        id: string
        role: 'admin' | 'moderator' | 'user'
    }
*/