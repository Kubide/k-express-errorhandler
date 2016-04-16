'use strict';
var chai = require("chai"),
    supertest = require('supertest'),
    should = chai.should(),
    express = require('express'),
    app,
    options = {};


describe('basic usage', function () {
    //setup server
    before(function(){
        app = express();
        var options = {
            errors : {
                app : {
                    user : {
                        myOwnError : {
                            status : 401,
                            msg : "you can't see me"
                        }
                    }
                }
            }
        };
        var kError = require('../index')(options);

        app.get('/error1', function (req, res, next) {
            next(kError.createError("http.badRequest"));
        });

        app.get('/error2', function (req, res, next) {
            next(kError.createError("app.user.myOwnError", {detail: new Date()}));
        });


        app.use(kError.errorHandling)
    });

    it('get a default http.badRequest error', function (done) {
        supertest(app)
            .get("/error1")
            .send()
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, res) {
                should.not.exist(err);
                res.body.should.have.property("msg", "http_error_bad_request");
                res.body.should.have.property("status", 400);
                res.body.should.have.property("code", "http.badRequest");
                console.log("hola", res.body);
                done();
            });
    });


    it('get an expecial error', function (done) {
        supertest(app)
            .get("/error2")
            .send()
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(401)
            .end(function (err, res) {
                should.not.exist(err);
                res.body.should.have.property("msg", "you can't see me");
                res.body.should.have.property("status", 401);
                res.body.should.have.property("code", "app.user.myOwnError");
                console.log("hola", res.body);
                done();
            });
    });

});

