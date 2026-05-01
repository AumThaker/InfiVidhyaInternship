import crypto from 'crypto'

async function createOtp(){
    return crypto.randomInt(100000, 1000000).toString();
}

export default createOtp