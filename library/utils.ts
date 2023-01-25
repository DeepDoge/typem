import type { MasterField } from "./field"

export namespace MasterUtils
{
    export type JsonPrimitive = string | number | boolean | null;
    export type JsonTypes = JsonPrimitive | JsonArray | JsonMap;
    export type JsonArray = Array<JsonTypes>;
    export type JsonMap = { [key: string]: JsonTypes };
    
    export type Obj = { [key: string]: unknown };
    
    export type Infer<T extends MasterField<any>> = T['TYPE']['VALUE_TYPE'];
};