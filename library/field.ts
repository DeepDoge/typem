import type { JsonTypes, Obj } from "./utils"

export interface MasterFieldOptions<Type, JsonType extends JsonTypes>
{
    label?: string
    description?: string
    default?: Type
}

export interface MasterFieldType<Type, JsonType extends JsonTypes, Options extends Obj>
{
    TYPE: Type
    JSON_TYPE: JsonType
    options: Options & MasterFieldOptions<Type, JsonType>
}

export abstract class MasterField<T extends MasterFieldType<unknown, JsonTypes, Obj>>
{
    public readonly TYPE: T = null!

    public readonly options: T['options']

    constructor(options: T['options'])
    {
        this.options = options
    }

    public abstract toJSONType(value: T['TYPE']): T['JSON_TYPE']
    public abstract fromJSONType(value: T['JSON_TYPE']): T['TYPE']

    protected abstract _validate(value: T['TYPE']): boolean
    public validate(value: T['TYPE']): T['TYPE']
    {
        if (value === undefined && this.options.default !== undefined)
            value = this.options.default
        if (this._validate(value))
            return value
        throw new Error(`Invalid value for field ${this.options.label ?? this.constructor}`)
    }

    public toJSON(value: T['TYPE'])
    {
        return JSON.stringify(this.toJSONType(value))
    }

    public fromJSON(value: string)
    {
        return this.fromJSONType(JSON.parse(value))
    }

    public typed(value: T['TYPE']): T['TYPE']
    {
        return value
    }
}