import type { MasterField, MasterFieldType } from "./field"
import { number } from "./fields/number"
import { string } from "./fields/string"
import type { Obj } from "./utils"



const test = {
    name: string({ label: "Name" }),
    age: number({ label: "Age", min: 0 }),
}

class MasterStruct<Fields extends Record<string, MasterField<MasterFieldType<unknown, any, Obj>>>>
{
    

    public readonly fields: Fields

    constructor(fields: Fields)
    {
        this.fields = fields
    }

    public toField()
    {

    }
}