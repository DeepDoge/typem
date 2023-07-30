function got(value: unknown) {
	return `${value}` ? `(${typeof value} : ${value})` : typeof value
}

// Syntax we want (for co-pilot):

const t_age = t_union(t_null().$(t_default(10)), t_undefined().$(t_default(20)), t_number().$(t_gte(0)))
const t_sex = t_union(t_literal("man"), t_literal("woman"))
const t_foo = t_array(t_string()).$(t_maxLength(10))

t_age.returnOrThrow(0) // 0
t_age.returnOrThrow(null) // 10
t_age.returnOrThrow(undefined) // 20
t_age.returnOrThrow(-1) // throws Typem.Error

t_age.type.creator === t_union
t_age.type.props === [t_null, t_undefined, t_number]
t_age.type.props[0].type.creator === t_null
t_age.type.props[0].type.extend.type.creator === t_default
t_age.type.props[0].type.extend.type=.props === [10]


// OR IDK that dumb, gonna look into this later

// Implementation:

export namespace Typem {
	export class Error extends TypeError {}
	export type Validator<TIn, TOut, TProps extends any[]> = (value: TIn, ...props: TProps) => TOut

	export namespace Type {
		export type Creator<TIn, TOut, TProps extends any[]> = (...props: TProps) => Type<TIn, TOut, TProps>
	}
	export type Type<TIn, TOut, TProps extends any[] = [], TExtend extends Type<any, any, any[]> = never> = {
		readonly type: {
			readonly creator: Type.Creator<TIn, TOut, TProps>
			readonly extend?: TExtend
            readonly props: TProps
		}
		returnOrThrow(value: TIn): TOut
        $<UExtend extends Type<any, any, any[]>>(extend: UExtend): Type<TIn, TOut, TProps, UExtend | TExtend>
	}

	export function defineType<TIn, TOut, TProps extends any[]>(validator: Validator<TIn, TOut, TProps>) {
		const creator = (...props: TProps) => {
			const type: Type<TIn, TOut, TProps> = {
				type: {
					creator,
					props
				},
				returnOrThrow(value) {
					return validator(value, ...props)
				},
                $<UExtend extends Type<any, any, any[]>>(extend: UExtend) {
                    return defineType<TIn, TOut, TProps, UExtend>(validator).$(extend)
                }
			}

			return type
		}
	}
}

export const t_never = Typem.defineType((value) => {
	throw new Typem.Error(`Expected never, got ${got(value)}`)
})

export const t_any = Typem.defineType((value) => value)
export const t_unknown = Typem.defineType((value) => value)

export const t_null = Typem.defineType(<TDefault>(value: unknown, options?: { default: TDefault }) => {
	if (value !== null) throw new Typem.Error(`Expected null, got ${got(value)}`)
	return options?.default
})

export const t_undefined = Typem.defineType(<TDefault>(value: unknown, options?: { default: TDefault }) => {
    if (value !== undefined) throw new Typem.Error(`Expected undefined, got ${got(value)}`)
    return options?.default
})

export const t_boolean = Typem.defineType((value) => {
    if (typeof value !== "boolean") throw new Typem.Error(`Expected boolean, got ${got(value)}`)
    return value
})

export const t_string = Typem.defineType((value) => {
    if (typeof value !== "string") throw new Typem.Error(`Expected string, got ${got(value)}`)
    return value
})

export const t_number = Typem.defineType((value) => {
    if (typeof value !== "number") throw new Typem.Error(`Expected number, got ${got(value)}`)
    return value
})

export const t_symbol = Typem.defineType((value) => {
    if (typeof value !== "symbol") throw new Typem.Error(`Expected symbol, got ${got(value)}`)
    return value
})

export const t_function = Typem.defineType((value) => {
    if (typeof value !== "function") throw new Typem.Error(`Expected function, got ${got(value)}`)
    return value
})

export const t_object = Typem.defineType((value) => {
    if (typeof value !== "object") throw new Typem.Error(`Expected object, got ${got(value)}`)
    return value
})

export const t_array = Typem.defineType((value, type: 
