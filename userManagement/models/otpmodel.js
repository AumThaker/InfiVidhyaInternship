import mongoose from 'mongoose'
import bcrypt from 'bcrypt'


const otpSchema = new mongoose.Schema({
    otp:{
        type:String,
        required:true,
    },
    user:{
        type:String || mongoose.Schema.Types.ObjectId,
        required:true,
        index:true
    },
    otpAttempts:{
        type:Number,
        default:0
    },
    createdAt: {
    type: Date,
    default: Date.now,
    expires: 600
  }
},{timestamps:true})


export async function hashOtp(otp){
    return await bcrypt.hash(otp, 10)
}


otpSchema.methods.compareOtp = async function(otpEntered) {
    return await bcrypt.compare(otpEntered, String(this.otp))
}

const Otp = mongoose.model('Otp',otpSchema)


export default Otp