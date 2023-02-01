import { $gte, $intersection, $literal, $null, $number, $object, $oneOf, $partial, $rangeLength, $string, $union } from "../library"

const $person = $partial({
    name: $rangeLength($string, 1, 32),
    age: $union($null, $gte($number, 0)),
    sex: $union($literal('man'), $literal('woman')),
    // or you can use `oneOf` instead of `union` and `literal`
    city: $oneOf(
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
    )
}, 'city')

const $memberRole = $oneOf('admin', 'moderator', 'user')
const $member = $intersection($person, $object({
    id: $string,
    role: $memberRole
}))
$member.typecheck({
    name: 'John',
    age: 30,
    sex: 'man',
    id: '1234567890',
    role: 'admin'
})
/* 
    Type of $member:
    {
        name: string
        age: number | null
        sex: 'man' | 'woman'
        city?: 'Kraków' | 'Oaxaca' | 'Moscow' | 'Kabul' | 'Baghdad' | 
                'Kuala, Lumpur' | 'Jeddah' | 'Riyadh' | 'Mogadishu' | 'Dubai' | 
                'Abu Dhabi' | 'Sanaa' | 'Ibadan' | 'Taizz' | 'Tehran'
        id: string
        role: 'admin' | 'moderator' | 'user'
    }
*/