import AsyncLock from "async-lock";
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
const transporter = nodemailer.createTransport({ 
    service: 'gmail', 
    auth: { 
      type: 'OAuth2', 
      user: process.env.EMAIL_USERNAME, 
      pass: process.env.EMAIL_PASSWORD, 
      clientId: process.env.GMAIL_CLIENT_ID, 
      clientSecret: process.env.GMAIL_CLIENT_SECRET, 
      refreshToken: process.env.GMAIL_REFRESH_TOKEN 
    } 
  }); 


const lock  = new AsyncLock();

const otpResource = {};

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function storeOtp(email,otp) {
    await lock.acquire('otpResource', () => {
        otpResource[email] = otp;

        // Set a timeout to delete the OTP after 5 minutes (300,000 ms)
        setTimeout(() => {
            lock.acquire('otpResource', () => {
                delete otpResource[email];
            });
        }, 5 * 60 * 1000);
    });
    console.log(`OTP sent to ${email}: ${otp}`);
}

export function verifyOtp(email, otp) {
    let isValid = false;
    if (otpResource[email] && otpResource[email] === otp) {
        isValid = true;
    }
    return isValid;
}

export async function sendOtp(email){
    const otp = generateOtp();
    await storeOtp(email,otp);

    const mailConfigurations = {  
        from: `${process.env.EMAIL_USERNAME}`, 
        to: email, 
        subject: 'Email verification for Quest', 
        text: `Hi there,\n
        Your otp for email verification is : ${otp}\n
        This OTP is valid for 5 minutes. If you did not request this, please ignore this email.
      `
    };

    try {
        let sent = await new Promise((resolve, reject) => {
            transporter.sendMail(mailConfigurations, (error, info) => {
                if (error) {
                    console.log("Error in sending email");
                    console.log(error);
                    resolve(false);
                } else {
                    console.log('Email Sent Successfully');
                    resolve(true);
                }
            });
        });
        return sent;
    } catch (err) {
        console.log("Unexpected error:", err);
        return false;
    }
}