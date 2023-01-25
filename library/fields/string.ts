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
    
    protected parser(value: string): string
    {
        if (typeof value !== "string")
            throw new Error("Value is not a string")
        if (this.options.minLength !== undefined && value.length < this.options.minLength)
            throw new Error("Value is too short")
        if (this.options.maxLength !== undefined && value.length > this.options.maxLength)
            throw new Error("Value is too long")
        
        return value
    }
}

export function string<Options extends StringField['options']>(options: Options): StringField
{
    return new StringField(options)
}
