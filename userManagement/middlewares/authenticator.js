import User from "../models/usermodel.js"
import { verifyARToken } from "../utility/jwtsign.js"

// for checking if user is logged in
async function authenticateUser(req,res,next){
    try {
        const user_token = req.cookies['access_token']
        if(!user_token) return res.status(403).json({message:"AUTHORIZATION ERROR : USER TOKEN NOT FOUND"})
        let userFetched = await verifyARToken(user_token,process.env.ACCESS_SECRET)
        let user = await User.findById(userFetched.id)
        if(!user) return res.status(403).json({message:"AUTHORIZATION ERROR : USER NOT FOUND"})
        req.user = user
        next()
    } catch (error) {
        return res.status(401).json({
            message: "INVALID OR EXPIRED TOKEN"
        })
    }
}


export default authenticateUser