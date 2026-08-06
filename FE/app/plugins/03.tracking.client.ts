// Plugin tracking khách ẩn danh (client-only — số 03 để chạy SAU 02.repositories,
// cần $trackingRepository lúc init). Toàn bộ fire-and-forget, fail-silent (D-07):
// tracking chết thì web bán hàng vẫn chạy y nguyên.
import {
  FIRST_TOUCH_COOKIE_NAME,
  FIRST_TOUCH_MAX_AGE_DAYS,
  TRACKING_SESSION_STORAGE_KEY,
  VISITOR_COOKIE_MAX_AGE_DAYS,
  VISITOR_COOKIE_NAME,
} from "~/constants/tracking.constant";
import type {
  TFirstTouch,
  TTrackEventDto,
  TTrackingApi,
  TTrackingAttribution,
  TTrackPageViewDto,
  TTrackingUtm,
  TVisitorEventType,
} from "~/types/tracking.type";

const DAY_SECONDS = 60 * 60 * 24;
const UTM_KEYS: (keyof TTrackingUtm)[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
];

export default defineNuxtPlugin((nuxtApp) => {
  const trackingRepository = nuxtApp.$trackingRepository as
    | {
        sendPageView: (body: TTrackPageViewDto) => Promise<unknown>;
        sendEvent: (body: TTrackEventDto) => Promise<unknown>;
      }
    | undefined;

  // secure tắt ở dev (localhost http); bật ở prod (https).
  const cookieSecure = !import.meta.dev;

  // 1) Cookie visitor ẩn danh — chưa có thì sinh UUID v4 (D-04, không PII).
  const visitorCookie = useCookie<string | null>(VISITOR_COOKIE_NAME, {
    maxAge: VISITOR_COOKIE_MAX_AGE_DAYS * DAY_SECONDS,
    sameSite: "lax",
    path: "/",
    secure: cookieSecure,
  });
  if (!visitorCookie.value) {
    visitorCookie.value = crypto.randomUUID();
  }

  // 2) Cookie attribution — LAST-TOUCH (cố ý đổi từ first-touch theo yêu cầu PO):
  //    - Mỗi lượt vào URL CÓ ?camp (và/hoặc utm) → GHI ĐÈ snapshot mã camp MỚI NHẤT
  //      + gia hạn 30 ngày (set .value làm mới maxAge của useCookie).
  //    - Điều hướng nội bộ KHÔNG có camp/utm → GIỮ NGUYÊN attribution đang có (không xóa).
  //    - Cookie đang trống mà URL cũng không camp → vẫn ghi snapshot rỗng để visitor được track.
  //    Đọc window.location sống (bài học memory: không tin router state khi lấy query),
  //    lấy camp + 5 key utm_* NGUYÊN VĂN (D-03). GIỮ chuỗi khóa cookie "first_touch" không đổi
  //    để không mất attribution của khách hiện có (chỉ đổi HÀNH VI ghi, không đổi tên khóa).
  const firstTouchCookie = useCookie<TFirstTouch | null>(FIRST_TOUCH_COOKIE_NAME, {
    maxAge: FIRST_TOUCH_MAX_AGE_DAYS * DAY_SECONDS,
    sameSite: "lax",
    path: "/",
    secure: cookieSecure,
  });
  try {
    const params = new URLSearchParams(window.location.search);
    const utm: TTrackingUtm = {};
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) utm[key] = value;
    }
    const camp = params.get("camp") || undefined;
    const hasAttribution = Boolean(camp) || Object.keys(utm).length > 0;
    if (hasAttribution) {
      // Last-touch: URL có camp/utm → ghi đè snapshot mới nhất + gia hạn 30 ngày.
      const lastTouch: TFirstTouch = {};
      if (camp) lastTouch.camp = camp;
      if (Object.keys(utm).length) lastTouch.utm = utm;
      firstTouchCookie.value = lastTouch;
    } else if (!firstTouchCookie.value) {
      // Không camp/utm và cookie đang trống → ghi snapshot rỗng để visitor được track.
      firstTouchCookie.value = {};
    }
    // else: điều hướng nội bộ không camp → giữ nguyên attribution đang có (không xóa).
  } catch {
    if (!firstTouchCookie.value) firstTouchCookie.value = {};
  }

  // 3) Session id — mất khi đóng tab; sinh mới nếu chưa có.
  const getSessionId = (): string => {
    try {
      let sessionId = window.sessionStorage.getItem(TRACKING_SESSION_STORAGE_KEY);
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        window.sessionStorage.setItem(TRACKING_SESSION_STORAGE_KEY, sessionId);
      }
      return sessionId;
    } catch {
      // sessionStorage bị chặn (private mode cực đoan) — vẫn trả UUID để không chặn luồng.
      return crypto.randomUUID();
    }
  };

  const getAttribution = (): TTrackingAttribution => {
    const firstTouch = firstTouchCookie.value ?? {};
    return {
      visitorId: visitorCookie.value ?? undefined,
      camp: firstTouch.camp,
      utm: firstTouch.utm,
    };
  };

  // 4) Bắn page view fire-and-forget mỗi lần đổi trang (D-07).
  const sendPageView = () => {
    try {
      const visitorId = visitorCookie.value;
      if (!visitorId || !trackingRepository) return;
      const firstTouch = firstTouchCookie.value ?? {};
      const body: TTrackPageViewDto = {
        sessionId: getSessionId(),
        visitorId,
        path: useRouter().currentRoute.value.fullPath,
        url: window.location.href,
        referrer: document.referrer || undefined,
        camp: firstTouch.camp,
        utm: firstTouch.utm,
      };
      void trackingRepository.sendPageView(body).catch(() => {});
    } catch {
      // nuốt tuyệt đối — tracking không bao giờ được ném vào luồng UI.
    }
  };

  // page:finish bắn cả lần load đầu (sau hydrate) lẫn mỗi lần điều hướng.
  nuxtApp.hook("page:finish", () => {
    sendPageView();
  });

  // 5) provide $tracking cho toàn app (composable + store + đơn/liên hệ).
  const trackEvent = (
    type: TVisitorEventType,
    extra?: { productId?: string; orderId?: string },
  ) => {
    try {
      const visitorId = visitorCookie.value;
      if (!visitorId || !trackingRepository) return;
      const firstTouch = firstTouchCookie.value ?? {};
      const body: TTrackEventDto = {
        sessionId: getSessionId(),
        visitorId,
        type,
        camp: firstTouch.camp,
        utm: firstTouch.utm,
        productId: extra?.productId,
        orderId: extra?.orderId,
      };
      void trackingRepository.sendEvent(body).catch(() => {});
    } catch {
      // fail-silent tuyệt đối.
    }
  };

  const tracking: TTrackingApi = { trackEvent, getAttribution };

  return {
    provide: {
      tracking,
    },
  };
});
