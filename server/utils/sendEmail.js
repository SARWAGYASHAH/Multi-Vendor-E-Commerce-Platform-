const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // If SMTP configurations are not fully set up, fallback to console log simulation
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS ||
    process.env.SMTP_USER.includes('your_email')
  ) {
    console.log('\n--- EMAIL SIMULATION ---');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message: \n${options.text}`);
    console.log('------------------------\n');
    return { status: 'simulated', message: 'Email logged to console successfully' };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"Multi-Vendor Marketplace" <${process.env.SMTP_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html || `<p>${options.text}</p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Nodemailer error: ', error.message);
    // Return mock success status so development flow doesn't block
    console.log('\n--- EMAIL SIMULATION FALLBACK ---');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message: \n${options.text}`);
    console.log('------------------------\n');
    return { status: 'fallback', error: error.message };
  }
};

module.exports = sendEmail;
