import { $enum, $gt, $infer, $intersection, $length, $lengthRange, $literal, $null, $number, $object, $optional, $string, $union } from "../library"

const $person = $object({
    name: $lengthRange($string(), 1, 32),
    age: $union($null(), $gt($number(), 0)),
    sex: $union($literal('man'), $literal('woman')),
    // or you can use `oneOf` instead of `union` and `literal`
    city: $optional($enum(
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

const $memberRole = $enum('admin', 'moderator', 'user')
const $member = $intersection($person, $object({
    id: $length($string(), 32),
    role: $memberRole
}))

/* 
    Type of $member:
    {
        name: string;
        age: number | null;
        sex: 'male' | 'female';
        city?: 'Kraków' | 'Oaxaca' | 'Moscow' | 'Kabul' | 'Baghdad' | 'Kuala, Lumpur' | 
            'Jeddah' | 'Riyadh' | 'Mogadishu' | 'Dubai' | 'Abu Dhabi' | 'Sanaa' | 'Ibadan' | 
            'Taizz' | 'Tehran' | null | undefined;
        id: string;
        role: 'admin' | 'moderator' | 'user';
    }
*/