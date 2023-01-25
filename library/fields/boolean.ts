import { MasterField, MasterFieldType } from "../field"

export type BooleanFieldType = MasterFieldType<boolean, boolean, {}>

export class BooleanField extends MasterField<BooleanFieldType>
{
    public toJSONType(value: boolean): boolean
    {
        return value
    }

    public fromJSONType(value: boolean): boolean
    {
        return value
    }
    
    protected parser(value: boolean): boolean
    {
        if (typeof value !== "boolean") throw new Error("Value is not a boolean")
        return value
    }   
}