const chai = require('chai');
const chaiHttp = require('chai-http');

const should = chai.should();

// Import server
var server = require('../../index');

// use chaiHttp for making the actual HTTP requests   
chai.use(chaiHttp);
describe('Todo API hospital', function () {

    it('test get all hospital success /api/hospital GET', function (done) {
        chai.request(server)
            .get('/api/hospital')
            .end(function (err, res) {

                res.should.have.status(200);
                res.should.be.json;
                done();
            });
    });
    it('test get doctor by id success /api/hospital/:id GET', function (done) {
        chai.request(server)
            .get('/api/hospital/3')
            .end(function (err, res) {

                res.should.have.status(200);
                res.body.should.have.property('message');
                console.log(res.body.message.id);
                res.body.message.id.should.have.equal(3);
                res.should.be.json;
                done();
            });
    });
    it('test get doctor by id failed /api/hospital/:id GET', function (done) {
        chai.request(server)
            .get('/api/hospital/444444')
            .end(function (err, res) {

                res.should.have.status(404);
                res.should.be.json;
                done();
            });
    });
});
