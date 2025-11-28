import nodemailer from "nodemailer";
import dotenv from 'dotenv';

dotenv.config();

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Set these in your .env file
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  attachments?: { filename: string; content: string; contentType?: string }[]
) => {
  try {
    const info = await transporter.sendMail({
      from: `"EdTrack System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments,
    });

    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};