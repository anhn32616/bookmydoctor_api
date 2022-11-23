
const express = require('express')
const router=express.Router()
const auth = require('./auth')



router.get("/status",(req,res)=>{
    res.status(200).json({status:'ok'})
})


router.use('/auth',auth)

module.exports = router;