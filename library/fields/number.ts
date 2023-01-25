import { MasterField, MasterFieldType } from "../field"

export type NumberFieldType = MasterFieldType<number, number,
{
    min?: number
    max?: number
}>

export class NumberField extends MasterField<NumberFieldType>
{
    public toJSONType(value: number): number
    {
        return value
    }

    public fromJSONType(value: number): number
    {
        return value
    }
    
    protected parser(value: number): number
    {
        if (typeof value !== "number")
            throw new Error("Value is not a number")
        if (this.options.min !== undefined && value < this.options.min)
            throw new Error("Value is too small")
        if (this.options.max !== undefined && value > this.options.max)
            throw new Error("Value is too big")
        
        return value
    }
    
}

export function number<Options extends NumberField['options']>(options: Options): NumberField
{
    return new NumberField(options)
}