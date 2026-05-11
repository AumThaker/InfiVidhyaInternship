import nodemailer from 'nodemailer'



async function sendMail(userMailId, mailSubject, mailText) {
    try {
        // const transporter = await nodemailer.createTransport({
        //     host: process.env.SMTP_HOST,
        //     port: process.env.SMTP_PORT,
        //     secure: process.env.SMTP_SECURE,
        //     requireTLS: process.env.SMTP_REQUIRE_TLS,
        //     auth: {
        //         user: process.env.SMTP_USER,
        //         pass: process.env.SMTP_PASS,
        //     },
        // });
        const transporter = await nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // Explicitly false as a boolean
            tls: {
                rejectUnauthorized: false // Bypasses SSL certificate check
            },
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS // DO NOT USE YOUR NORMAL PASSWORD
            }
        });

        const mail = await transporter.sendMail({
            from: `USER MANAGEMENT SYSTEM <${process.env.SMTP_USER}>`,
            to: userMailId,
            subject: mailSubject,
            text: mailText,  // html is optional not added for now
        });

        return mail
    } catch (error) {
        console.log("ERROR SENDING MAIL : ", error)
    }
}

export default sendMail