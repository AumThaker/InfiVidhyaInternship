/* 
    USER MODEL 
    
    FIRSTNAME - TEXT , INDEXING 
    LASTNAME - TEXT , INDEXING 
    EMAIL - TEXT , UNIQUE , INDEXING
    PASSWORD - TEXT (STORE HASHED PASSWORD)
    ROLE - ENUM ( STUDENT , FACULTY )
    MOBILE NO - NUMBER , LENGTH = 10
    ACCESS_TOKEN - TEXT
    ACTIVE_STATUS - TRUE OR FALSE
    TIMESTAMPS

    EMAIL FIRSTNAME LASTNAME INDEXED 

*/


import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

// user model
const userSchema = new mongoose.Schema({
    googleId: { type: String },
    first_name: {
        type: String,
        required: true,
        trim: true,
        index: true,
        maxLength: 20
    },
    last_name: {
        type: String,
        required: true,
        trim: true,
        index: true,
        maxLength: 20
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Enter valid email']
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    role: {
        type: String,
        enum: ['student', 'faculty'],
        required: true
    },
    mobile_no: {
        type: String,
        match: [/^[0-9]{10}$/, 'Mobile must be 10 digits']
    },
    active_status: {
        type: Boolean,
        default: true
    },
    access_token: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

// indexing
userSchema.index({ email: 1, first_name: 1 })

// password hashing
export async function hashPassword(password) {
    return await bcrypt.hash(password, 10)
}

// compare password
userSchema.methods.comparePassword = async function (passwordEntered) {
    return await bcrypt.compare(passwordEntered, String(this.password))
}


let User = mongoose.model('User', userSchema)

export default User

