Ok so types are basically pipelines, and we get the type of the last element of the pipeline<br/>
but instead of doing t().t().t() we are just gonna place them all together as a tuple

we just have to have many genererics but can be done.

so a type gets validators as parameters idk eadiouh nwiufwehglet me just write the imaginary syntax


```ts
const string = unknown((value) => {
  if (typeof value !== "string") throw
  return {
    value,
    params: {
      isString: true
    }
  }
})

object({ a: string() })
```


idfk 

at first i was thinking something like this when started to write this

```ts
union(string(email(), minLength(20)), undefined())
const foo = union(string(minLength(3)), number(gte(10)), object({ hello: string(), wallet: bigint(gte(0)) }))
```

foo
```ts
{
  type: union
  args: [
    {
      type: string
      args: [
          {
            type: minLength
            args: [3]
          }
      ]
    }
  ]
}
etc...
```

or every type can create their own returns that we can merge

```ts
{
  union: [
      {
        isString: true
        minLength: 3
      }
  ]
}
```

some types get other types as arguments, some has their own arguments<br/>
i think this gives us two distict types, or lets say validators

so validators that has no arguments gets other validators as args, and we pipe them.<br/>
but if a validator has its own arguments than, it can't be piped in the same way

yup, this is cool. and validator wouldn't throw but return something always

it might return an { error }, or it might return the { value, params } thing<br/>
etc. all typed literally

also maybe a bit much but if validators are typed correctly. i want parse, to return the correct type if we dont pass an unknown to it

so if i do foo("hello") return type should be the correct literal type, and there are errors them. if parse errors we return array of errors
