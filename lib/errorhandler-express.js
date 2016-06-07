"use strict";
let _ = require('lodash'),
    util = require("util");

/*
Rehacer el módulo:
- exportar objeto no funcion
- mandar la configuración grande al handler
- crear errores en modo "bobo"

*/

function kError( code, info, implementationContext ) {

    if(typeof code == 'object') {
        info = code;
    }

    this.info = (info || {});
    this.code = (code || this.info.code || "default");


    // Capture the current stacktrace and store it in the property "this.stack". By
    // providing the implementationContext argument, we will remove the current
    // constructor (or the optional factory function) line-item from the stacktrace; this
    // is good because it will reduce the implementation noise in the stack property.
    // --
    // Rad More: https://code.google.com/p/v8-wiki/wiki/JavaScriptStackTraceApi#Stack_trace_collection_for_custom_exceptions
    Error.captureStackTrace( this, ( implementationContext || kError ) );
}

util.inherits( kError, Error );


module.exports = {
    kError : kError,

    createError : function(code, options){
        return new kError(code, options, this);
    },

    errorHandling : function(options){
        options = (options || {});

        let errors = _.merge({
                default : {
                    detail : '',
                    msg : "default msg",
                    status : 500
                },
                http : {
                    badRequest : {
                        msg : "http_error_bad_request",
                        status : 400
                    },
                    unauthorized : {
                        msg : "http_error_unauthorized",
                        status : 401
                    },
                    forbidden: {
                        msg : "http_error_forbidden",
                        status : 401
                    },
                    notFound: {
                        msg : "http_error_not_found",
                        status : 404
                    },
                    conflict: {
                        msg : "http_error_conflict",
                        status : 409
                    },
                    unprocessable: {
                        msg: "http_error_unprocessable",
                        status : 422
                    }

                }
            },options.errors),

            __ = options.translate || function(a) {return a},

            parsers = _.merge({
                mongoose : function(err){
                    let mongoose = require("mongoose");
                    // remove stack property from mongoose validations
                    if (err.info.detail instanceof mongoose.Error.ValidationError) {
                        delete err.info.detail.stack;

                        _.each(err.info.detail.errors, function (error, index) {
                            delete err.info.detail.errors[index].stack;
                        })
                    }
                }
            },options.parsers);

            return function(err, req, res, next) {

                if (err instanceof kError) {
                    let ret = errors,
                        split = err.code.split(".");

                    _.each(split, function(el, index){
                        if (!ret) {
                            return false;
                        }

                        ret = ret[el];
                    });

                    if (!ret) {
                        ret = errors.default;
                        err.code = "default";
                    }

                    ret.code = err.code;

                    err.info= _.merge(ret, err.info);


                    // execute each parser
                    _.each(parsers, function(parser){
                        parser(err);
                    });

                    err.info.msg = __(err.info.msg);

                    res.status(err.info.status).json(err.info);

                } else if (err instanceof Error) {
                    res.status(500).json({
                        code: "default",
                        status : errors.default.code,
                        msg: __(errors.default.msg),
                        detail: err.stack
                    });
                } else {
                    next();
                }

            }

    }

};