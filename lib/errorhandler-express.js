"use strict";
let _ = require('lodash'),
    util = require("util");

module.exports = function(options){
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
            test : function(err) {
//                err.info = "caca";
            },
            mongoose : function(err){
                let mongoose = require("mongoose");
                // remove stack property from mongoose validations
                if (err.info.detail instanceof mongoose.Error.ValidationError) {
                    delete err.info.detail.stack;

                    _.each(err.info.detail.errors, function (error, index) {
                        delete err.detail.errors[index].stack;
                    })
                }
            }
        },options.parsers),

        kError = function( info, implementationContext ) {

            this.info = (info || {});

            // Capture the current stacktrace and store it in the property "this.stack". By
            // providing the implementationContext argument, we will remove the current
            // constructor (or the optional factory function) line-item from the stacktrace; this
            // is good because it will reduce the implementation noise in the stack property.
            // --
            // Rad More: https://code.google.com/p/v8-wiki/wiki/JavaScriptStackTraceApi#Stack_trace_collection_for_custom_exceptions
            Error.captureStackTrace( this, ( implementationContext || kError ) );
        };

    util.inherits( kError, Error );

    return {
        error : kError,
        createError : function(code, options){
            let ret = errors;


            switch (typeof code) {
                case 'string':
                    let split = code.split(".");
                    _.each(split, function(el, index){
                        if (!ret) {
                            return false;
                        }

                        ret = ret[el];
                    });

                    if (!ret) {
                        ret = errors .default;
                        code = "default";
                    }

                    break;
                case 'object':
                    options = code;
                    code = "default";
                    ret = ret.default;
                    break;
                default:
                    break;
            }

            ret.code = code;



            if (options) {
                ret = _.merge(ret, options);
            }

            return( new kError( ret, this ) );

        },
        errorHandling : function(err, req, res, next) {
            if (err instanceof kError) {

                // execute each parser
                _.each(parsers, function(parser){
                    parser(err);
                });

                err.info.msg = __(err.info.msg);

                res.status(err.info.status).json(err.info);
            } else if (err instanceof Error) {
                res.status(500).json({
                    code: "default",
                    status : errors.default,
                    msg: __(errors.default.msg),
                    detail: err.stack
                });
            } else {
                next();
            }
        }
    }
};