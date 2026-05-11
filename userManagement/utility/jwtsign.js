import jwt from 'jsonwebtoken'

async function jwtSignIn(payload){
    const result = await jwt.sign(payload,process.env.JWT_SECRET)   
    return result
}

async function jwtVerify(code){
    const result = await jwt.verify(code,process.env.JWT_SECRET)
    return result
}

async function generateARToken(payload,secret,expiry){
    const result = await jwt.sign(payload,secret,{expiresIn : expiry})
    return result
}

async function verifyARToken(code,secret){
    const result = await jwt.verify(code,secret)
    return result
}


export {jwtSignIn,jwtVerify,generateARToken,verifyARToken}