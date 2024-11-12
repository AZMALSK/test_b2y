
const db = require('../ConnectionDB/Connect'); // Sequelize instance
const transporter = require('../middleware/emailConfig'); // Import the global transporter

// Fetch the email template by name
const getEmailTemplate = async (templateName) => {
  const template = await db.EmailTemplate.findOne({
    where: { TemplateName: templateName },
    
  });

  if (!template) throw new Error('Email template not found');

  return template;
};

// // Replace placeholders with actual data
// const replacePlaceholders = (template, data) => {
//   let subject = template.Subject;
//   let body = template.Body;

//   // Replace placeholders like {{OrderNumber}} with actual values
//   Object.keys(data).forEach((key) => {
//     const placeholder = `{{${key}}}`;
//     subject = subject.replace(new RegExp(placeholder, 'g'), data[key]);
//     body = body.replace(new RegExp(placeholder, 'g'), data[key]);
//   });

//   return { subject, body };
// };

// Replace placeholders with actual data and add CSS
const replacePlaceholders = (template, data) => {
  let subject = template.Subject;
  let body = template.Body;
  let styles = template.Styles;

  // Replace placeholders like {{OrderNumber}} with actual values
  Object.keys(data).forEach((key) => {
    const placeholder = `{{${key}}}`;
    subject = subject.replace(new RegExp(placeholder, 'g'), data[key]);
    body = body.replace(new RegExp(placeholder, 'g'), data[key]);
  });

  // Inject CSS into the email body
  if (styles) {
    body = `
      <html>
        <head>
          <style>${styles}</style>
        </head>
        <body>${body}</body>
      </html>
    `;
  }

  return { subject, body };
};


// Global function to send email using a template
// const sendTemplateEmail = async (templateName, data) => {
//   try {
//     const template = await getEmailTemplate(templateName);

//     // Replace placeholders in the email template
//     const { subject, body } = replacePlaceholders(template, data);

//     // Define email options
//     const mailOptions = {
//       from: '"Imly Studios" <vinay.g@b2yinfy.com>',
//       to: data.customerEmail,
//       subject: subject,
//       html: body,
//     };

//     // Send email using the globally configured transporter
//     let info = await transporter.sendMail(mailOptions);
//     console.log('Email sent:', info.messageId);
//   } catch (error) {
//     console.error('Error sending email:', error);
//   }
// };

// Global function to send email using a template
const sendTemplateEmail = async (templateName, data) => {
  try {
    const template = await getEmailTemplate(templateName);

    // Replace placeholders and inject CSS into the email template
    const { subject, body } = replacePlaceholders(template, data);

    // Define email options
    const mailOptions = {
      from: '"Imly Studio"  <vinay.g@b2yinfy.com>',
      to: data.customerEmail,
      subject: subject,
      html: body,
    };

    // Send email using the globally configured transporter
    let info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};


module.exports = { sendTemplateEmail };
