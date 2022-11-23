const chai = require('chai');
const chaiHttp = require('chai-http');

const should = chai.should();

// Import server
var server = require('../../index');

// use chaiHttp for making the actual HTTP requests   
chai.use(chaiHttp);
describe('Todo API Schedule', function () {

    it('test get all Schedules success /api/schedule GET', function (done) {
        chai.request(server)
            .get('/api/schedule')
            .end(function (err, res) {

                res.should.have.status(200);
                res.should.be.json;
                done();
            });
    });
    it('test get Schuedules by doctor_id success /api/schedule/doctor/:id GET', function (done) {
        chai.request(server)
            .get('/api/schedule/doctor/12')
            .end(function (err, res) {

                res.should.have.status(200);
                res.body.should.have.property('schedules');
                res.should.be.json;
                done();
            });
    });
    it('test get doctor by id failed /api/schedule/:id GET', function (done) {
        chai.request(server)
            .get('/api/schedule/10000')
            .end(function (err, res) {

                res.should.have.status(404);
                // res.should.be.json;
                done();
            });
    });
});
