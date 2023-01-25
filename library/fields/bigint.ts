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
    
    protected parser(value: bigint): bigint
    {
        if (typeof value !== "bigint")
            throw new Error("Value is not a bigint")
        if (this.options.min !== undefined && value < this.options.min)
            throw new Error("Value is too small")
        if (this.options.max !== undefined && value > this.options.max)
            throw new Error("Value is too big")
        
        return value
    }
    
}

export function big<Options extends BigIntField['options']>(options: Options): BigIntField
{
    return new BigIntField(options)
}
