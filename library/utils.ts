export type JsonPrimitive = string | number | boolean | null;
export type JsonTypes = JsonPrimitive | JsonArray | JsonMap;
export type JsonArray = Array<JsonTypes>;
export type JsonMap = { [key: string]: JsonTypes };

export type Obj = { [key: string]: any };