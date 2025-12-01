import nodemailer from 'nodemailer';
import config from '../config/index.js';

// Email transporter
const createEmailTransporter = () => {
  if (!config.smtp.user || !config.smtp.pass) {
    console.warn('Email configuration not set. Email notifications disabled.');
    return null;
  }

  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
};

const emailTransporter = createEmailTransporter();

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<boolean> => {
  if (!emailTransporter) {
    console.log(`[Email Mock] To: ${to}, Subject: ${subject}`);
    return true;
  }

  try {
    await emailTransporter.sendMail({
      from: config.smtp.user,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

export const sendOTPEmail = async (
  email: string,
  otp: string,
  type: 'login' | 'verification' | 'delivery'
): Promise<boolean> => {
  const subjects: Record<string, string> = {
    login: 'Your MoveNmeal Login OTP',
    verification: 'Verify Your MoveNmeal Account',
    delivery: 'Your Delivery Verification Code',
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f97316;">MoveNmeal</h2>
      <p>Your ${type === 'login' ? 'login' : type === 'delivery' ? 'delivery verification' : 'verification'} code is:</p>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${otp}</span>
      </div>
      <p style="color: #6b7280; margin-top: 20px;">This code expires in 10 minutes.</p>
      <p style="color: #6b7280;">If you didn't request this code, please ignore this email.</p>
    </div>
  `;

  return sendEmail(email, subjects[type], html);
};

export const sendClusterJoinNotification = async (
  email: string,
  clusterName: string,
  memberName: string
): Promise<boolean> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f97316;">MoveNmeal</h2>
      <p><strong>${memberName}</strong> has joined your cluster "${clusterName}"!</p>
      <p>Your group is growing - more savings on delivery fees!</p>
    </div>
  `;

  return sendEmail(email, `New member joined ${clusterName}`, html);
};

export const sendOrderConfirmation = async (
  email: string,
  orderId: string,
  items: Array<{ name: string; quantity: number; price: number }>,
  total: number
): Promise<boolean> => {
  const itemsHtml = items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">$${item.price.toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f97316;">MoveNmeal</h2>
      <p>Your order has been confirmed!</p>
      <p>Order ID: <strong>${orderId}</strong></p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 8px; text-align: left;">Item</th>
            <th style="padding: 8px; text-align: left;">Qty</th>
            <th style="padding: 8px; text-align: left;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 8px; font-weight: bold;">Total</td>
            <td style="padding: 8px; font-weight: bold;">$${total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <p>We'll notify you when your order is on its way!</p>
    </div>
  `;

  return sendEmail(email, 'Order Confirmed - MoveNmeal', html);
};

export const sendDeliveryOTPNotification = async (
  email: string,
  senderOTP: string,
  receiverOTP: string
): Promise<boolean> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f97316;">MoveNmeal</h2>
      <p>Your order is out for delivery!</p>

      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Sender Verification Code (for vendor):</strong></p>
        <span style="font-size: 24px; font-weight: bold; color: #1f2937;">${senderOTP}</span>
      </div>

      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Receiver Verification Code (for you):</strong></p>
        <span style="font-size: 24px; font-weight: bold; color: #1f2937;">${receiverOTP}</span>
      </div>

      <p style="color: #6b7280;">Share these codes with the delivery rider to confirm pickup and delivery.</p>
    </div>
  `;

  return sendEmail(email, 'Your Order is Out for Delivery - MoveNmeal', html);
};

// Food Cluster Status Change Notifications
export const sendFoodClusterStatusNotification = async (
  email: string,
  memberName: string,
  clusterTitle: string,
  restaurant: string,
  newStatus: string,
  otp?: string
): Promise<boolean> => {
  const statusMessages: Record<string, { subject: string; heading: string; body: string; color: string }> = {
    ordered: {
      subject: `Order Placed - ${clusterTitle}`,
      heading: 'Order Placed!',
      body: `The cluster order from <strong>${restaurant}</strong> has been placed. You will be notified when it's ready for pickup.`,
      color: '#f97316',
    },
    ready: {
      subject: `Order Ready for Pickup - ${clusterTitle}`,
      heading: 'Your Order is Ready!',
      body: `The order from <strong>${restaurant}</strong> is ready for pickup. Please collect your items from the cluster organizer.`,
      color: '#10b981',
    },
    collecting: {
      subject: `Collection Started - ${clusterTitle}`,
      heading: 'Collection in Progress',
      body: `Members are now collecting their orders from <strong>${restaurant}</strong>. Head over to collect yours!`,
      color: '#f59e0b',
    },
    completed: {
      subject: `Cluster Completed - ${clusterTitle}`,
      heading: 'Order Complete!',
      body: `The food cluster for <strong>${restaurant}</strong> has been completed. Thanks for using MoveNmeal!`,
      color: '#6b7280',
    },
    cancelled: {
      subject: `Cluster Cancelled - ${clusterTitle}`,
      heading: 'Cluster Cancelled',
      body: `Unfortunately, the food cluster for <strong>${restaurant}</strong> has been cancelled by the organizer.`,
      color: '#ef4444',
    },
  };

  const statusInfo = statusMessages[newStatus];
  if (!statusInfo) return false;

  const otpSection = otp && newStatus === 'ready' ? `
    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 10px 0; color: #92400e;"><strong>Your Collection Code:</strong></p>
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #92400e;">${otp}</span>
      <p style="margin: 10px 0 0 0; font-size: 12px; color: #a16207;">Show this code to the organizer to collect your order</p>
    </div>
  ` : '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #f97316; margin-bottom: 5px;">MoveNmeal</h2>
      <p style="color: #6b7280; margin-top: 0;">Hi ${memberName},</p>

      <div style="background: ${statusInfo.color}10; border-left: 4px solid ${statusInfo.color}; padding: 15px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
        <h3 style="color: ${statusInfo.color}; margin: 0 0 10px 0;">${statusInfo.heading}</h3>
        <p style="color: #374151; margin: 0;">${statusInfo.body}</p>
      </div>

      ${otpSection}

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        View details in your <a href="https://movenmeal.com/dashboard/food-clusters" style="color: #f97316;">MoveNmeal dashboard</a>.
      </p>
    </div>
  `;

  return sendEmail(email, statusInfo.subject, html);
};

// Ride Cluster Status Change Notifications
export const sendRideClusterStatusNotification = async (
  email: string,
  memberName: string,
  rideTitle: string,
  destination: string,
  newStatus: string,
  departureTime?: string
): Promise<boolean> => {
  const statusMessages: Record<string, { subject: string; heading: string; body: string; color: string }> = {
    filled: {
      subject: `Ride Full - ${rideTitle}`,
      heading: 'Ride is Full!',
      body: `All seats for the ride to <strong>${destination}</strong> have been booked. Get ready for departure!`,
      color: '#10b981',
    },
    in_progress: {
      subject: `Ride Started - ${rideTitle}`,
      heading: 'Your Ride has Started!',
      body: `The ride to <strong>${destination}</strong> is now in progress. Have a safe journey!`,
      color: '#f59e0b',
    },
    completed: {
      subject: `Ride Completed - ${rideTitle}`,
      heading: 'Ride Complete!',
      body: `The ride to <strong>${destination}</strong> has been completed. Thanks for sharing the ride!`,
      color: '#6b7280',
    },
    cancelled: {
      subject: `Ride Cancelled - ${rideTitle}`,
      heading: 'Ride Cancelled',
      body: `Unfortunately, the ride to <strong>${destination}</strong> has been cancelled by the organizer.`,
      color: '#ef4444',
    },
  };

  const statusInfo = statusMessages[newStatus];
  if (!statusInfo) return false;

  const timeSection = departureTime && newStatus === 'filled' ? `
    <div style="background: #f3f4f6; padding: 15px 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #374151;"><strong>Departure Time:</strong> ${new Date(departureTime).toLocaleString()}</p>
    </div>
  ` : '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #059669; margin-bottom: 5px;">MoveNmeal</h2>
      <p style="color: #6b7280; margin-top: 0;">Hi ${memberName},</p>

      <div style="background: ${statusInfo.color}10; border-left: 4px solid ${statusInfo.color}; padding: 15px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
        <h3 style="color: ${statusInfo.color}; margin: 0 0 10px 0;">${statusInfo.heading}</h3>
        <p style="color: #374151; margin: 0;">${statusInfo.body}</p>
      </div>

      ${timeSection}

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        View details in your <a href="https://movenmeal.com/dashboard/ride-clusters" style="color: #059669;">MoveNmeal dashboard</a>.
      </p>
    </div>
  `;

  return sendEmail(email, statusInfo.subject, html);
};
