const chai = require('chai');
const chaiHttp = require('chai-http');

const should = chai.should();

// Import server
var server = require('../../index');

// use chaiHttp for making the actual HTTP requests   
chai.use(chaiHttp);
describe('Todo API', function () {

    it('should add a todo on /api/auth/login GET', function (done) {
        chai.request(server)
            .get('/api/specialty')
            .end(function (err, resonse) {
                resonse.should.have.status(200);
                done()
            })
        done();
    });
});
