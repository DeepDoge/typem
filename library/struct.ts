import { MasterField, MasterFieldType } from "./field"
import type { MasterUtils } from "./utils"

export type StructFieldType<Fields extends Record<string, MasterField<MasterFieldType<unknown, any, MasterUtils.Obj>>>> = MasterFieldType<{ [K in keyof Fields]: Fields[K]['TYPE']['VALUE_TYPE'] }, { [K in keyof Fields]: Fields[K]['TYPE']['JSON_TYPE'] }, {}>

export class MasterStruct<Fields extends Record<string, MasterField<MasterFieldType<unknown, any, MasterUtils.Obj>>>> extends MasterField<StructFieldType<Fields>>
{
    public readonly fields: Fields

    constructor(fields: Fields)
    {
        super({})
        this.fields = fields
    }

    public toJSONType(value: StructFieldType<Fields>['VALUE_TYPE']): StructFieldType<Fields>['JSON_TYPE']
    {
        const result = {} as any
        for (const [key, field] of Object.entries(this.fields))
            result[key] = field.toJSONType(value[key])
        return result
    }

    public fromJSONType(value: StructFieldType<Fields>['JSON_TYPE']): StructFieldType<Fields>['VALUE_TYPE']
    {
        const result = {} as any
        for (const [key, field] of Object.entries(this.fields))
            result[key] = field.fromJSONType(value[key])
        return result
    }

    protected parser(value: StructFieldType<Fields>['VALUE_TYPE']): StructFieldType<Fields>['VALUE_TYPE']
    {
        const result = {} as any
        for (const [key, field] of Object.entries(this.fields))
            result[key] = field.parse(value[key])
        return result
    }
}

export function struct<Fields extends Record<string, MasterField<MasterFieldType<unknown, any, any>>>>(fields: Fields): MasterStruct<Fields>
{
    return new MasterStruct(fields)
}