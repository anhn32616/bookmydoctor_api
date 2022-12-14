const express = require('express')
const bodyParser = require('body-parser')
const connectDB = require('./src/config/connectDB');
const app = express()
const http = require('http');
const server = http.createServer(app);
const SocketServer = require('./socketServer')
const Sentry = require('./log');


const port = 3000

app.use(function (req, res, next) {
  const allowedOrigins = ['http://localhost:3000', 'https://bookmydoctor.onrender.com', 'https://bookmydoctor-9g4m.onrender.com', 'https://bookmydoctor.netlify.app', 'https://test-payment.momo.vn', 'https://scintillating-semifreddo-52ce18.netlify.app'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-credentials", true);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, UPDATE");
  next();
});

app.use(bodyParser.json())

const route = require('./src/routes')

// Route init
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use("/api", route)






// ---------------------//

// let server = app.listen(port, async () => {
//   console.log(`Example app listening on port ${port}`)
// })
Sentry.captureMessage('error', 'error');
try {
  connectDB();
  let io = require('socket.io')(server);

  io.on('connection', (socket) => {
    SocketServer(socket)
  })
  server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  });
  // throw Error('error socket');
} catch (error) {
  Sentry.captureException(error);
}



module.exports = server


