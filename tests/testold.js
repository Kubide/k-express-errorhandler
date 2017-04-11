/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

const chai = require('chai');
const supertest = require('supertest');
const express = require('express');
const kError = require('../index');

const should = chai.should();
let app = null;

describe('basic usage', () => {
    // setup server
  before(() => {
    app = express();
    const options = {
      errors: {
        app: {
          user: {
            myOwnError: {
              status: 401,
              msg: "you can't see me",
            },
          },
        },
      },
    };

    app.get('/error1', (req, res, next) => {
      next(kError.createError('http.badRequest'));
    });

    app.get('/error2', (req, res, next) => {
      next(kError.createError('app.user.myOwnError', { detail: new Date() }));
    });

    app.use(kError.errorHandling(options));
  });

  it('get a default http.badRequest error', (done) => {
    supertest(app)
            .get('/error1')
            .send()
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
              should.not.exist(err);
              res.body.should.have.property('msg', 'http_error_bad_request');
              res.body.should.have.property('status', 400);
              res.body.should.have.property('code', 'http.badRequest');
              console.log('hola', res.body);
              done();
            });
  });


  it('get an expecial error', (done) => {
    supertest(app)
            .get('/error2')
            .send()
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(401)
            .end((err, res) => {
              should.not.exist(err);
              res.body.should.have.property('msg', "you can't see me");
              res.body.should.have.property('status', 401);
              res.body.should.have.property('code', 'app.user.myOwnError');
              console.log('hola', res.body);
              done();
            });
  });
});

/* eslint-enable no-unused-vars */
/* eslint-enable no-undef */
