require('dotenv').config();
const { Sequelize } = require('sequelize');


// Option 3: Passing parameters separately (other dialects)
const sequelize = new Sequelize(process.env.database, process.env.usernameDB, process.env.password, {
  host: process.env.host,
  dialect: 'mysql',
  logging: false,
  timezone: "+07:00",
  dialectOptions:{
    "ssl":{
      "require":true,
      "rejectUnauthorized": true
    }
  },
  dialectModule: require('mysql2'),
  sync: { force: false },
  /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
});

let connectDB =async ()=>{
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

module.exports = connectDB