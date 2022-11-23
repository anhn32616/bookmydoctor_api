
const express = require('express')
const router=express.Router()
const auth = require('./auth')
const patient = require('./patient')



router.get("/status",(req,res)=>{
    res.status(200).json({status:'ok'})
})


router.use('/auth',auth)
router.use('/patients',patient)

module.exports = router;