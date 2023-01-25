import { MasterField, MasterFieldType } from "./field"
import type { MasterUtils } from "./utils"

export type ArrayFieldType<T extends MasterField<MasterFieldType<unknown, any, any>>> = MasterFieldType<T['TYPE']['VALUE_TYPE'][], T['TYPE']['JSON_TYPE'][], {
    min?: number
    max?: number
}>

export class MasterArray<T extends MasterField<MasterFieldType<unknown, any, MasterUtils.Obj>>> extends MasterField<ArrayFieldType<T>>
{
    public readonly field: T

    constructor(field: T, options: ArrayFieldType<T>['OPTIONS_TYPE'] = {})
    {
        super(options)
        this.field = field
    }

    public toJSONType(value: ArrayFieldType<T>['VALUE_TYPE']): ArrayFieldType<T>['JSON_TYPE']
    {
        return value.map(v => this.field.toJSONType(v))
    }

    public fromJSONType(value: ArrayFieldType<T>['JSON_TYPE']): ArrayFieldType<T>['VALUE_TYPE']
    {
        return value.map(v => this.field.fromJSONType(v))
    }

    protected parser(value: ArrayFieldType<T>['VALUE_TYPE']): ArrayFieldType<T>['VALUE_TYPE']
    {
        if (!Array.isArray(value)) throw new Error("Value is not an array")
        if (this.options.min !== undefined && value.length < this.options.min)
            throw new Error(`Array length is less than ${this.options.min}`)
        if (this.options.max !== undefined && value.length > this.options.max)
            throw new Error(`Array length is more than ${this.options.max}`)
        return value.map(v => this.field.parse(v))
    }
}

export function array<T extends MasterField<MasterFieldType<unknown, any, any>>>(field: T, options: ArrayFieldType<T>['OPTIONS_TYPE'] = {}): MasterArray<T>
{
    return new MasterArray(field, options)
}