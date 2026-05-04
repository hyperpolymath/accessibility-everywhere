type app
type router
type req
type res
type nextFn = Exn.t => unit
type errorMiddleware = (Exn.t, req, res, nextFn) => unit
type middleware = (req, res, nextFn) => unit
type asyncHandler = (req, res, nextFn) => promise<unit>

@module("express") external make: unit => app = "default"
@module("express") @scope("default") external router: unit => router = "Router"
@module("express") @scope("default") external jsonParser: {..} => middleware = "json"

@send external use: (app, middleware) => unit = "use"
@send external usePath: (app, string, middleware) => unit = "use"
@send external useRouter: (app, string, router) => unit = "use"
@send external useError: (app, errorMiddleware) => unit = "use"
@send external useFinal: (app, middleware) => unit = "use"

@send external get: (app, string, asyncHandler) => unit = "get"
@send external listen: (app, int, unit => unit) => unit = "listen"

@send external routerGet: (router, string, asyncHandler) => unit = "get"
@send external routerPost: (router, string, asyncHandler) => unit = "post"
@send external routerPatch: (router, string, asyncHandler) => unit = "patch"
@send external routerPut: (router, string, asyncHandler) => unit = "put"
@send external routerDelete: (router, string, asyncHandler) => unit = "delete"

@get external body: req => Dict.t<JSON.t> = "body"
@get external params: req => Dict.t<string> = "params"
@get external query: req => Dict.t<string> = "query"
@get external protocol: req => string = "protocol"
@send external getHeader: (req, string) => string = "get"

@send external resJson: (res, 'a) => unit = "json"
@send external status: (res, int) => res = "status"
@send external send: (res, string) => unit = "send"
@send external setHeader: (res, string, string) => unit = "setHeader"

module Cors = {
  @module("cors") external make: unit => middleware = "default"
}

module Helmet = {
  @module("helmet") external make: unit => middleware = "default"
}

module Compression = {
  @module("compression") external make: unit => middleware = "default"
}

module RateLimit = {
  type opts = {
    windowMs: int,
    max: int,
    message: string,
  }
  @module("express-rate-limit") external make: opts => middleware = "default"
}

module Dotenv = {
  @module("dotenv") external config: unit => unit = "config"
}
