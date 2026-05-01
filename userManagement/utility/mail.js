import nodemailer from nodemailer



async function sendMail(userMailId,mailSubject,mailText) {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.verify();

        const mail = await transporter.sendMail({
            from: `USER MANAGEMENT SYSTEM <${process.env.SMTP_USER}>`, 
            to: userMailId,
            subject: mailSubject,
            text: mailText,  // html is optional not added for now
        });

    } catch (error) {
        console.log("ERROR SENDING MAIL : ",error)
    }
}

export default sendMail