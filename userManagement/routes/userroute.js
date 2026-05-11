import { Router } from "express";
import authenticateUser from "../middlewares/authenticator.js";
import { activateUser, changeDetails, changePasswordSendOtp, createUser, deactivateUser, loginUser, logoutUser, regenerateAccessToken, registerUser, updatePass } from "../controllers/usercontrol.js";
const router = Router()
router.route('/createUser').post(createUser)
router.route('/registerUser').post(registerUser)
router.route('/loginUser').post(loginUser)
router.route('/logoutUser').post(authenticateUser,logoutUser)
router.route('/activateUser').post(activateUser)
router.route('/deactivateUser').post(authenticateUser,deactivateUser)
router.route('/changeUserDetails').post(authenticateUser,changeDetails)
router.route('/changePasswordSendOtp').post(authenticateUser,changePasswordSendOtp)
router.route('/updateUserPassword').post(authenticateUser,updatePass)
router.route('/refresh').post(regenerateAccessToken)

export default router