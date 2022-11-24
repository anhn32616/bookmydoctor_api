
const { Client } = require('@elastic/elasticsearch')
const client = new Client({
  cloud: {
    id: 'My_deployment:f2f30970fab7491880aed0bd3ed3346e',
  },
  auth: {
    username: 'elastic',
    password: 'p2HJ8WVOTChkBfKsj3rRj8WN'
  }
})
module.exports = client;  
