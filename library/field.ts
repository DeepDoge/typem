import type { MasterUtils } from "./utils"

export interface MasterFieldOptions<Type, _JsonType extends MasterUtils.JsonTypes>
{
    label?: string
    description?: string
    default?: Type
}

export interface MasterFieldType<Type, JsonType extends MasterUtils.JsonTypes, Options extends MasterUtils.Obj>
{
    VALUE_TYPE: Type
    JSON_TYPE: JsonType
    OPTIONS_TYPE: Options & MasterFieldOptions<Type, JsonType>
}

export abstract class MasterField<T extends MasterFieldType<unknown, any, any>>
{
    public readonly TYPE: T = null!

    public readonly options: T['OPTIONS_TYPE']

    constructor(options: T['OPTIONS_TYPE'])
    {
        this.options = options
    }

    public abstract toJSONType(value: T['VALUE_TYPE']): T['JSON_TYPE']
    public abstract fromJSONType(value: T['JSON_TYPE']): T['VALUE_TYPE']

    protected abstract parser(value: T['VALUE_TYPE']): T['VALUE_TYPE']
    public parse(value: T['VALUE_TYPE']): T['VALUE_TYPE']
    {
        if (value === undefined && this.options.default !== undefined)
            value = this.options.default
            
        value = this.parser(value)
        return value
    }
    public parseUnknown(value: unknown): T['VALUE_TYPE']
    {
        return this.parse(value as T['VALUE_TYPE'])
    }

    public toJSON(value: T['VALUE_TYPE'])
    {
        return JSON.stringify(this.toJSONType(value))
    }

    public fromJSON(value: string)
    {
        return this.fromJSONType(JSON.parse(value))
    }
}