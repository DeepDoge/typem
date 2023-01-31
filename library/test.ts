import { array } from "./array"
import { number } from "./fields/number"
import { string } from "./fields/string"
import { struct } from "./struct"
import type { MasterUtils } from "./utils"

const test = struct({
    name: array(string({ label: "Name" })),
    age: number({ label: "Age", min: 0 }),
})

const data: MasterUtils.Infer<typeof test> = {
    name: ["John", "Doe"],
    age: 20,
}

const dataUnknown = {
    name: "John",
    age: 20,
}

const a = test.parse(data)
const b = test.parseUnknown(dataUnknown)
a
b