
const express = require('express')
const router=express.Router()
const auth = require('./auth')
const patient = require('./patient')
const specialty = require('./specialty')






const doctor = require('./doctor');
const hospital = require('./hospital');
const clinic = require('./clinic')




router.get("/status",(req,res)=>{
    res.status(200).json({status:'ok'})
})


router.use('/auth',auth)
router.use('/patients',patient)
router.use('/specialty',specialty)








router.use('/doctor',doctor)
router.use('/hospital',hospital)
router.use('/clinic', clinic)




module.exports = router;