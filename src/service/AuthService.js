const db = require('../models/index');
const bcrypt = require('bcryptjs');
let checkUserEmail = (email) => {
    return new Promise(async(resolve, reject) => {
        try {
            let user = await db.User.findOne({
                where: {email: email}
            })
            if (user) {
                resolve(true)
            }
            else {
                resolve(false)
            }
        } catch (e) {
            reject(e);
        }
    })
}



module.exports = {
    checkUserEmail: checkUserEmail,
}