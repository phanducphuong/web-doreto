import type { TTrackEventDto, TTrackPageViewDto } from "~/types/tracking.type";

// Repository tracking — endpoint public (không cần token). Route trần không prefix /api.
// Gọi luôn fire-and-forget từ plugin (bên gọi tự nuốt lỗi), ở đây chỉ dựng request.
export const createTrackingRepository = ($api: typeof $fetch) => ({
  sendPageView: (body: TTrackPageViewDto) =>
    $api("/tracking/page-view", {
      method: "POST",
      body,
    }),

  sendEvent: (body: TTrackEventDto) =>
    $api("/tracking/event", {
      method: "POST",
      body,
    }),
});
