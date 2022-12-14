
const express = require('express')
const router=express.Router()
const auth = require('./auth')
const patient = require('./patient')
const specialty = require('./specialty')
const schedule = require('./schedule')
const messagechat = require('./mesagechat')
const user = require('./user')
const revenue = require('./revenue')


const doctor = require('./doctor');
const hospital = require('./hospital');
const clinic = require('./clinic')
const notification = require('./notification')
const appointment = require('./appointment');
const paymentMomo = require('./paymentMomo');
const payment = require('./payment');







router.get("/status",(req,res)=>{
    res.status(200).json({status:'ok'})
})


router.use('/auth',auth)
router.use('/patients',patient)
router.use('/specialty',specialty)
router.use('/schedule',schedule)
router.use('/messagechat',messagechat)
router.use('/users',user)
router.use('/revenue', revenue)





router.use('/doctor',doctor)
router.use('/hospital',hospital)
router.use('/clinic', clinic)
router.use('/notification',notification)
router.use('/appointment', appointment)
router.use('/payment-momo', paymentMomo)
router.use('/payment', payment)





module.exports = router;