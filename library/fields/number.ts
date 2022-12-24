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
    
    protected _validate(value: number): boolean
    {
        return typeof value === "number" &&
            (this.options.min === undefined || value >= this.options.min) &&
            (this.options.max === undefined || value <= this.options.max)
    }
    
}

export function number<Options extends NumberField['options']>(options: Options): NumberField
{
    return new NumberField(options)
}