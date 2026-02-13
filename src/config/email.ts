import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

const EMAIL_USER = process.env.EMAIL_USER as string;
const EMAIL_PASS = process.env.EMAIL_PASS as string;

// Validate email credentials
if (!EMAIL_USER || !EMAIL_PASS) {
    console.error('❌ EMAIL_USER or EMAIL_PASS not configured in .env file');
    console.log('EMAIL_USER:', EMAIL_USER ? 'Set' : 'Not Set');
    console.log('EMAIL_PASS:', EMAIL_PASS ? 'Set' : 'Not Set');
}

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        const mailOptions = {
            from: `JustHike <${EMAIL_USER}>`,
            to,
            subject,
            html,
        };
        
        console.log('Attempting to send email to:', to);
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (error: any) {
        console.error('Email sending error:', error.message);
        throw error;
    }
}