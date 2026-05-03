type schema
type validationDetail = {message: string}
type validationError = {details: array<validationDetail>}
type validationResult = {error: option<validationError>, value: Dict.t<JSON.t>}

@module("joi") external object: Dict.t<schema> => schema = "object"

@module("joi") external string: unit => schema = "string"
@module("joi") external boolean: unit => schema = "boolean"
@send external uri: schema => schema = "uri"
@send external required: schema => schema = "required"
@send external valid: (schema, array<string>) => schema = "valid"
@send external defaultStr: (schema, string) => schema = "default"
@send external defaultBool: (schema, bool) => schema = "default"

@send external validate: (schema, 'a) => validationResult = "validate"
