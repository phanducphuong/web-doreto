// Cookie options dùng chung cho access/refresh token.
// - maxAge: cookie sống 7 ngày (bằng tuổi thọ refresh token BE) → không mất phiên
//   khi đóng trình duyệt (trước đây là session-cookie, đóng browser là phải đăng nhập lại).
// - sameSite "lax": chặn gửi cookie trong request cross-site (giảm CSRF), vẫn cho điều hướng thường.
// - secure: bật ở production (chỉ gửi qua HTTPS); tắt ở dev để chạy http://localhost.
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 ngày

const authCookieOptions = () => ({
  maxAge: AUTH_COOKIE_MAX_AGE,
  sameSite: "lax" as const,
  secure: !import.meta.dev,
  path: "/",
});

export const useAccessTokenCookie = () => useCookie("access_token", authCookieOptions());
export const useRefreshTokenCookie = () => useCookie("refresh_token", authCookieOptions());
