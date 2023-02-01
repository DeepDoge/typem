import { $gte, $intersection, $literal, $null, $number, $object, $oneOf, $optional, $rangeLength, $string, $union } from "../library"

const $person = $object({
    name: $rangeLength($string, 1, 32),
    age: $union($null, $gte($number, 0)),
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

/* 
    Type of $member:
    {
        name: string
        age: number | null
        sex: 'man' | 'woman'
        city?: 'Kraków' | 'Oaxaca' | 'Moscow' | 'Kabul' | 
            'Baghdad' | 'Kuala, Lumpur' | 'Jeddah' | 'Riyadh' | 'Mogadishu' | 
            'Dubai' | 'Abu Dhabi' | 'Sanaa' | 'Ibadan' | 'Taizz' | 'Tehran'
        id: string
        role: 'admin' | 'moderator' | 'user'
    }
*/