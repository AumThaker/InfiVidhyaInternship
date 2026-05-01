import User from "../models/usermodel"

// for checking if user is logged in
async function authenticateUser(req,res,next){
    const user_token = req.cookies['access_token']
    if(!user_token) return res.status(403).json({message:"AUTHORIZATION ERROR : USER TOKEN NOT FOUND"})
    let user = await User.findOne({access_token:user_token},{_id:1})
    if(!user) return res.status(403).json({message:"AUTHORIZATION ERROR : USER NOT FOUND"})
    req.user = user
    next()
}


export default authenticateUser