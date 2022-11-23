
const express = require('express')
const router=express.Router()
const auth = require('./auth')
const patient = require('./patient')
const specialty = require('./specialty')






const doctor = require('./doctor');
const hospital = require('./hospital');



router.get("/status",(req,res)=>{
    res.status(200).json({status:'ok'})
})


router.use('/auth',auth)
router.use('/patients',patient)
router.use('/specialty',specialty)








router.use('/doctor',doctor)
router.use('/hospital',hospital)



module.exports = router;