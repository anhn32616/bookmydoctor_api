const chai = require('chai');
const chaiHttp = require('chai-http');

const should = chai.should();

// Import server
var server = require('../../index');

// use chaiHttp for making the actual HTTP requests   
chai.use(chaiHttp);
describe('Todo API', function () {

    it('test get all doctor /api/doctor GET', function (done) {
        chai.request(server)
            .get('/api/doctor')
            .end(function (err, res) {

                res.should.have.status(200);
                res.should.be.json;
                done();
            });
    });
    it('test get doctor by id /api/doctor/:id GET', function (done) {
        chai.request(server)
            .get('/api/doctor/21')
            .end(function (err, res) {

                res.should.have.status(200);
                res.body.should.have.property('message');
                console.log(res.body.message);
                res.should.be.json;
                done();
            });
    });
});
