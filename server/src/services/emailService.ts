import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  MAIL_FROM
} = process.env;

const port = Number(SMTP_PORT || 587);
const secure = SMTP_SECURE ? SMTP_SECURE === "true" : port === 465;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port,
  secure,
  auth: SMTP_USER
    ? {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    : undefined
});

export interface PasswordResetMailParams {
  to: string;
  restaurantName: string;
  ownerName?: string;
  otp: string;
}

export const sendPasswordResetEmail = async ({
  to,
  restaurantName,
  ownerName,
  otp
}: PasswordResetMailParams) => {
  if (!SMTP_HOST) {
    throw new Error("SMTP_HOST chưa được cấu hình");
  }

  const from = MAIL_FROM || SMTP_USER || "no-reply@example.com";
  const greeting = ownerName ? `Anh/chị ${ownerName}` : restaurantName;

  const text = [
    `Xin chào ${greeting},`,
    "",
    "Hệ thống nhận được yêu cầu đổi mật khẩu cho tài khoản quản trị nhà hàng.",
    "Vui lòng sử dụng mã OTP dưới đây để đặt lại mật khẩu:",
    `Mã OTP: ${otp}`,
    "",
    "Lưu ý: đường link/mã OTP chỉ có hiệu lực trong 15 phút.",
    "",
    "Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này."
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <p>Xin chào <strong>${greeting}</strong>,</p>
      <p>Hệ thống nhận được yêu cầu đổi mật khẩu cho tài khoản quản trị nhà hàng.</p>
      <p>Vui lòng sử dụng mã OTP dưới đây để đặt lại mật khẩu:</p>
      <p style="font-size: 20px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
      <p><em>Mã OTP chỉ có hiệu lực trong 15 phút.</em></p>
      <p>Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này.</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: "Đặt lại mật khẩu tài khoản nhà hàng",
    text,
    html
  });
};

export interface WelcomeRestaurantMailParams {
  to: string;
  restaurantName: string;
  ownerName?: string;
  username: string;
  password: string;
  dashboardUrl: string;
}

export const sendNewRestaurantWelcomeEmail = async ({
  to,
  restaurantName,
  ownerName,
  username,
  password,
  dashboardUrl
}: WelcomeRestaurantMailParams) => {
  if (!SMTP_HOST) {
    throw new Error("SMTP_HOST chưa được cấu hình");
  }

  const from = MAIL_FROM || SMTP_USER || "no-reply@example.com";
  const greeting = ownerName ? `Anh/chị ${ownerName}` : restaurantName;

  const text = [
    `Xin chào ${greeting},`,
    "",
    "Nhà hàng của bạn đã được kích hoạt trên hệ thống QR Food Order.",
    "",
    `Thông tin đăng nhập:`,
    `- Tên đăng nhập: ${username}`,
    `- Mật khẩu tạm: ${password}`,
    "",
    `Trang quản lý: ${dashboardUrl}`,
    "",
    "Vui lòng đăng nhập và đổi mật khẩu ngay tại mục Đổi mật khẩu để đảm bảo an toàn.",
    "",
    "Chúc bạn kinh doanh hiệu quả!"
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <p>Xin chào <strong>${greeting}</strong>,</p>
      <p>Nhà hàng của bạn đã được kích hoạt trên hệ thống <strong>QR Food Order</strong>.</p>
      <p><strong>Thông tin đăng nhập:</strong></p>
      <ul>
        <li>Tên đăng nhập: <code>${username}</code></li>
        <li>Mật khẩu tạm: <code>${password}</code></li>
      </ul>
      <p>Trang quản lý: <a href="${dashboardUrl}">${dashboardUrl}</a></p>
      <p>Vui lòng đăng nhập và đổi mật khẩu ngay tại mục <em>Đổi mật khẩu</em> để đảm bảo an toàn.</p>
      <p>Chúc bạn kinh doanh hiệu quả!</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: "Chào mừng nhà hàng mới trên QR Food Order",
    text,
    html
  });
};

