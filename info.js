var client = require('./connection.js');

const InfoElasticsearch = async() =>{
    response = await client.cluster.health({
        wait_for_status: 'yellow',
        timeout: '50s'
    })
    console.log(response);
}
InfoElasticsearch();