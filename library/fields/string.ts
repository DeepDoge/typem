import { MasterField, MasterFieldType } from "../field"

export type StringFieldType = MasterFieldType<string, string, 
{
    minLength?: number
    maxLength?: number
}>

export class StringField extends MasterField<StringFieldType>
{
    public toJSONType(value: string): string
    {
        return value
    }

    public fromJSONType(value: string): string
    {
        return value
    }
    
    protected _validate(value: string): boolean
    {
        return typeof value === "string" &&
            (this.options.minLength === undefined || value.length >= this.options.minLength) &&
            (this.options.maxLength === undefined || value.length <= this.options.maxLength)
    }
}

export function string<Options extends StringField['options']>(options: Options): StringField
{
    return new StringField(options)
}
