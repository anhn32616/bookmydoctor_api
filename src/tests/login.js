const chai = require('chai');
const chaiHttp = require('chai-http');

const should = chai.should();

// Import server
var server = require('../../index');

// use chaiHttp for making the actual HTTP requests   
chai.use(chaiHttp);
describe('Todo API', function () {
    // beforeEach(function (done) {
    // });

    // afterEach(function (done) {
    //     Todo.collection.drop().then(function () {

    //         // success     
    //     }).catch(function () {

    //         // error handling
    //         console.warn(' collection may not exists!');
    //     })
    //     done();
    // });

    it('should add a todo on /api/auth/login POST', function (done) {
        chai.request(server)
            .post('/api/auth/login')
            .send({
                'email': 'anh9@gmai.com',
                'password': '123456'
            })
            .end(function (err, res) {

                // the res object should have a status of 201
                res.should.have.status(200);
                res.should.be.json;
                done();
            });
    });
});
