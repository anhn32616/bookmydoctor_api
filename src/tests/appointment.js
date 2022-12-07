const chai = require('chai');
const chaiHttp = require('chai-http');

const should = chai.should();

// Import server
var server = require('../../index');

// use chaiHttp for making the actual HTTP requests   
chai.use(chaiHttp);
describe('Todo API appointment', function () {

    it('test get appointment of user success /api/appointment/user GET', function (done) {
        chai.request(server)
            .post('/api/auth/login')
            .send({
                'email': 'anh9@gmai.com',
                'password': '123'
            })
            .end(function (err, res) {

                res.should.have.status(200);
                res.should.be.json;
                res.body.should.have.property('token');
                res.body.should.have.property('user');
                var userId = res.body.user.id;
                var token = res.body.token;
                console.log('userId: ' + userId);

                chai.request(server)
                    .get(`/api/appointment/user/${userId}`)
                    .set('Authorization',token)
                    .end(function (err, resonse) {
                        resonse.should.have.status(200);
                        done()
                    })
            });
    });
    it('test get all appointment with acc admin /api/appointment/ GET', function (done) {
        chai.request(server)
            .post('/api/auth/login')
            .send({
                'email': 'admin@gmail.com',
                'password': '12345678'
            })
            .end(function (err, res) {

                res.should.have.status(200);
                res.should.be.json;
                res.body.should.have.property('token');
                res.body.should.have.property('user');
                var userId = res.body.user.id;
                var token = res.body.token;
                console.log('userId: ' + userId);

                chai.request(server)
                    .get(`/api/appointment`)
                    .set('Authorization',token)
                    .end(function (err, resonse) {
                        resonse.should.have.status(200);
                        done()
                    })
            });
    });
});
