import nodemailer from "nodemailer";

export async function sendmail(email, title, body) {
  try {
    let transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    let info = await transporter.sendMail({
      from: "Madhurum Honey",
      to: `${email}`,
      subject: `${title}`,
      html: `${body}`,
    });

    console.log(info);

    return info;
  } catch (error) {
    console.log("error occurred in sendmail function:", error.message);
  }
}
