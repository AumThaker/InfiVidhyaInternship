import { Router } from "express";
import authenticateUser from "../middlewares/authenticator.js";
import { activateUser, changeDetails, changePasswordSendOtp, createUser, deactivateUser, loginUser, logoutUser, regenerateAccessToken, registerUser, updatePass, googleLoginSuccess } from "../controllers/usercontrol.js";
import passport from "passport";
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
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);
router.get(
  '/google/callback',

  passport.authenticate('google', {
    session: false,
    failureRedirect: '/login',
  }),

  googleLoginSuccess
);

export default router