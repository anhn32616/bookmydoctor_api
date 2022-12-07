
const { Client } = require('@elastic/elasticsearch')
const client = new Client({
  cloud: {
    id: 'My_deployment:dXMtY2VudHJhbDEuZ2NwLmNsb3VkLmVzLmlvJGYyZjMwOTcwZmFiNzQ5MTg4MGFlZDBiZDNlZDMzNDZlJDc3OTc4MWVmMDllMDQ2NjBhM2ExNTM3ZTE5NmYxZjg1',
  },
  auth: {
    username: 'elastic',
    password: 'p2HJ8WVOTChkBfKsj3rRj8WN'
  }
})
module.exports = client;  
