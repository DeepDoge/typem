import { MasterField, MasterFieldType } from "../field"

export type BigIntFieldType = MasterFieldType<bigint, string, 
{
    min?: bigint
    max?: bigint
}>

export class BigIntField extends MasterField<BigIntFieldType>
{
    public toJSONType(value: bigint): string
    {
        return value.toString()
    }

    public fromJSONType(value: string): bigint
    {
        return BigInt(value)
    }
    
    protected _validate(value: bigint): boolean
    {
        return typeof value === "bigint" &&
            (this.options.min === undefined || value >= this.options.min) &&
            (this.options.max === undefined || value <= this.options.max)
    }
    
}

export function big<Options extends BigIntField['options']>(options: Options): BigIntField
{
    return new BigIntField(options)
}
