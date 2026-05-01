//   login , logout , register, createUser , activateUser , deactivateUser , changeDetails , changePassword
import User, { hashPassword } from "../models/usermodel.js"
import { jwtSignIn, jwtVerify } from "../utility/jwtsign.js"
import sendMail from "../utility/mail.js"
import createOtp from "../utility/otpCreation.js"

// temp user created
async function createUser(req, res) {
    try {
        const { first_name, last_name, email, password, role, mobile_no } = req.body

        // all required fields
        if (!first_name || !last_name || !email || !password || !role || !mobile_no) return res.status(400).json({ message: "ALL REQUIRED FIELDS TO BE FILLED" })

        // unique email check
        let emailAlreadyExists = await User.findOne({ email }, { email: 1, _id: 0 })
        if (emailAlreadyExists) return res.status(400).json({ message: "ACCOUNT WITH ENTERED EMAIL ALREADY EXISTS", success: false })

        // email regex check
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) return res.status(400).json({ message: "ENTER VALID EMAIL ID", success: false })

        // password regex check 
        const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        if (!passRegex.test(password)) return res.status(400).json({ message: "PASSWORD SHOULD CONTAIN 1 UPPERCASE , 1 LOWERCASE , 1 SPECIAL SYMBOL , 1 DIGIT , LENGTH SHOULD BE 8-16", success: false })
        const hashedPassword = await hashPassword(password)
        if (!hashedPassword) return res.status(400).json({ message: "PASSWORD HASH ERROR" })

        // mobile regex check
        const mobRegex = /^[0-9]{10}$/
        if (!mobRegex.test(mobile_no)) return res.status(400).json({ message: "ENTER VALID MOBILE NUMBER", success: false })

        // role check
        const allowedRoles = [process.env.ROLE1, process.env.ROLE2]
        if (!allowedRoles.includes(role)) return res.status(400).json({ message: "SELECT A VALID ROLE", success: false })

        // otp creation
        let otp = await createOtp()
        if (!otp) return res.status(400).json({ message: "ACCOUNT CREATION - OTP CREATION FAILED", success: false })
        let mail = await sendMail(email, "ACCOUNT CREATION - OTP SENT VALID FOR 10 MINUTES", `OTP : ${otp}`)
        if (!mail) return res.status(400).json({ message: "ACCOUNT CREATION - MAIL SENT FAILED", success: false })

        // jwt sign user
        let user = {
            first_name,
            last_name,
            email,
            hashedPassword,
            role,
            mobile_no,
            otp,
        }
        let signedUser = await jwtSignIn(user)
        if (!signedUser) return res.status(400).json({ message: "JWT SIGN USER FAILED", success: false })

        let cookieOptions = {
            httpOnly: true,
            secure: false,
            expires: new Date(Date.now() + 10 * 60 * 1000)
        }

        return res.status(200).cookie('temp_user', signedUser, cookieOptions).json({ message: "USER DATA ACQUIRED -> OTP VERIFICATION", success: true })

    } catch (error) {
        return res.status(500).json({ message: `ERROR WHILE CREATING USER : ${error.message}`, success: false })
    }


}

// user creation
async function registerUser(req, res) {
    try {
        const { otpEntered } = req.body
        const signedUser = req.cookies['temp_user']

        // otp , signedUser validation
        if (!otpEntered) return res.status(400).json({ message: "ENTER 6-DIGIT OTP", success: false })
        if (!signedUser) return res.status(404).json({ message: "OTP TIME LIMIT EXPIRED", success: false })

        // unsign user
        let user = await jwtVerify(signedUser)
        if (!user) return res.status(400).json({ message: "USER UNSIGN ERROR", success: false })

        // checking otp
        if (String(otpEntered) !== String(user.otp)) return res.status(400).json({ message: "INVALID OTP ENTERED", success: false })

        const { first_name, last_name, email, hashedPassword, role, mobile_no } = user

        // checking existing user with same email
        let existingUser = await User.findOne({ email }, { email: 1, _id: 0 })
        if (existingUser) return res.status(400).json({ message: "EMAIL ALREADY EXISTS", success: false })

        // registering user into database
        let userCreation = await User.create({ first_name, last_name, email, password, role, mobile_no })
        if (!userCreation) return res.status(400).json({ message: "USER CREATION ERROR", success: false })

        let mail = await sendMail(email, "ACCOUNT CREATION MAIL", 'ACCOUNT CREATED SUCCESSFULLY')
        if (!mail) return res.status(400).json({ message: "ACCOUNT CREATION FAILED", success: false })

        return res.status(200).clearCookie('temp_user').json({ message: "USER SUCCESSFULLY CREATED", success: true })
    } catch (error) {
        return res.status(500).json({ message: `USER CREATION ERROR : ${error.message}`, success: false })
    }
}

async function loginUser(req, res) {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ message: "ENTER COMPLETE DETAILS", success: false })
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) return res.status(400).json({ message: "ENTER VALID EMAIL ID", success: false })

        const user = await User.findOne({ email })
        if (!user) return res.status(400).json({ message: "INVALID CREDENTIALS", success: false })

        const isMatch = await user.comparePassword(password)
        if (!isMatch) return res.status(400).json({ message: "INVALID CREDENTIALS", success: false })

        const activeStatus = user.active_status
        if (!activeStatus) return res.status(400).json({ message: "USER NOT ACTIVE", success: false, userActive: false })

        const accessToken = await jwtSignIn({ userId: user._id, role: user.role }, { expiresIn: '7d' })

        user.access_token = true
        await user.save()

        let cookieOptions = {
            httpOnly: true,
            secure: false,
            expires: new Date(Date.now() + 7 * 86400000)
        }

        return res
            .status(200)
            .cookie('access_token', accessToken, cookieOptions)
            .json({ message: "USER LOGGED IN SUCCESSFULLY", success: true })

    } catch (error) {
        return res.status(500).json({ message: `LOGIN ERROR : ${error.message}`, success: false })
    }
}

async function logoutUser(req, res) {
    return res
        .status(200)
        .clearCookie('access_token', {
            httpOnly: true,
            secure: true,
        })
        .json({ message: "SUCCESSFULLY LOGGED OUT", success: true })
}

async function activateUser(req, res) {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ message: "ENTER COMPLETE DETAILS", success: false })
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) return res.status(400).json({ message: "ENTER VALID EMAIL ID", success: false })

        const user = await User.findOne({ email })
        if (!user) return res.status(400).json({ message: "INVALID CREDENTIALS", success: false })

        if (user.active_status) {
            return res.status(400).json({ message: "USER ALREADY ACTIVE", success: false })
        }

        const isMatch = await user.comparePassword(password)
        if (!isMatch) return res.status(400).json({ message: "INVALID CREDENTIALS", success: false })

        user.active_status = true
        await user.save()

        let mail = await sendMail(email, "ACTIVATING USER MAIL", 'USER ACTIVATED SUCCESSFULLY')
        if (!mail) return res.status(400).json({ message: "ACTIVATING USER FAILED", success: false })

        return res.status(200).json({ message: "USER ACTIVATED SUCCESSFULLY", success: true })
    } catch (error) {
        return res.status(500).json({ message: `USER ACTIVATION ERROR : ${error.message}`, success: false })
    }
}

async function deactivateUser(req, res) {
    try {
        const userId = req.user

        const user = await User.findById(userId)
        if (!user) return res.status(400).json({ message: "DEACTIVATING USER ERROR : USER NOT FOUND", success: false })

        user.active_status = false
        user.access_token = false
        await user.save()

        let mail = await sendMail(user.email, "DEACTIVATING USER MAIL", 'USER DEACTIVATED SUCCESSFULLY')
        if (!mail) return res.status(400).json({ message: "DEACTIVATING USER FAILED", success: false })

        return res
            .status(200)
            .clearCookie('access_token', {
                httpOnly: true,
                secure: true,
            })
            .json({ message: "SUCCESSFULLY DEACTIVATED AND LOGGED OUT", success: true })
    } catch (error) {
        return res.status(500).json({ message: `USER DEACTIVATION ERROR : ${error.message}`, success: false })
    }
}

// for changing firstname , lastname , mobileno 
async function changeDetails(req, res) {
    try {
        const { field, value, password } = req.body
        const userId = req.user

        if (!field || !value) return res.status(400).json({ message: "ENTER COMPLETE DETAIL", success: false })
        const allowedFields = ['first_name', 'last_name', 'mobile_no']
        if (!allowedFields.includes(field)) return res.status(400).json({ message: "INVALID USER DATA CHANGE", success: false })
        if (field === 'mobile_no') {
            let mobRegex = /^[0-9]{10}$/
            if (!mobRegex.test(value)) return res.status(400).json({ message: "MOBILE NUMBER SHOULD BE OF 10 DIGITS", success: false })
        }

        const user = await User.findById(userId)
        if (!user) return res.status(400).json({ message: "USER NOT FOUND", success: false })

        let passCheck = await user.comparePassword(password)
        if (!passCheck) return res.status(400).json({ message: "USER DETAILS UPDATION - INCORRECT PASSWORD ENTERED", success: false })

        user[field] = value
        await user.save()

        let mail = await sendMail(user.email, "USER DETAIL UPDATION", `USER ${field} UPDATED `)
        if (!mail) return res.status(400).json({ message: "USER DETAIL UPDATION FAILED", success: false })

        return res.status(200).json({ message: "USER DETAILS CHANGED", success: true })
    } catch (error) {
        return res.status(500).json({ message: `USER DETAILS UPDATION ERROR : ${error.message}`, success: false })
    }

}

async function changePasswordSendOtp(req, res) {
    try {

        const userId = req.user
        const user = await User.findById(userId, { _id: 1 , email:1 })
        if (!user) return res.status(404).json({ message: "CHANGE PASSWORD - USER NOT FOUND", success: false })

        let otp = await createOtp()
        if (!otp) return res.status(404).json({ message: "CHANGE PASSWORD - OTP CREATION FAILED", success: false })

        let mail = await sendMail(user.email, "USER PASSWORD CHANGE - OTP SENT VALID FOR 10 MINUTES", `OTP : ${otp} `)
        if (!mail) return res.status(400).json({ message: "USER PASSWORD CHANGE FAILED", success: false })

        let otpData = await jwtSignIn({ otp, userId })

        const cookieOptions = {
            httpOnly: true,
            secure: true,
            expires: new Date(Date.now() + 10 * 60 * 1000)
        }

        return res.status(200).cookie('pass-change', otpData, cookieOptions).json({ message: "PASSWORD CHANGE SUCCESSFULL", success: true })
    } catch (error) {
        return res.status(500).json({ message: `USER PASSWORD CHANGE ERROR : ${error.message}`, success: false })
    }

}

async function updatePass(req, res) {
    try {
        const { otpEntered, passwordEntered } = req.body
        const userId = req.user
        const otpData = req.cookies['pass-change']
        const user = await User.findById(userId).select('+password')
        if (!user) return res.status(404).json({ message: "CHANGE PASSWORD - USER NOT FOUND", success: false })
        const {  otp, userId: id } = await jwtVerify(otpData)
        if (!otp || !id) return res.status(400).json({ message: "USER PASSWORD UPDATE ERROR - OTP AND ID NOT FOUND", success: false })
        if (id !== userId) return res.status(403).clearCookie('pass-change').clearCookie('access-token').json({ message: "UNAUTHORISED ACCESS", success: false })
        if (String(otpEntered) !== String(otp)) return res.status(400).json({ message: "INVALID OTP", success: false })
        const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        if (!passRegex.test(passwordEntered)) return res.status(400).json({ message: "PASSWORD SHOULD CONTAIN 1 UPPERCASE , 1 LOWERCASE , 1 SPECIAL SYMBOL , 1 DIGIT , LENGTH SHOULD BE 8-16", success: false })
        const hashedPassword = await hashPassword(passwordEntered)
        if (!hashedPassword) return res.status(400).json({ message: "USER PASSWORD UPDATE - PASSWORD HASH FAILED", success: false })
        user.password = hashedPassword
        user.access_token = false
        await user.save()
        // login again
        return res.status(200).clearCookie('pass-change').clearCookie('access_token').json({ message: "USER PASSWORD UPDATE SUCCESSFULL", success: true })
    } catch (error) {
        return res.status(500).json({ message: `USER PASSWORD UPDATE ERROR : ${error.message}`, success: false })
    }
}


export {createUser,registerUser,loginUser,logoutUser,activateUser,deactivateUser,changeDetails,changePasswordSendOtp,updatePass}