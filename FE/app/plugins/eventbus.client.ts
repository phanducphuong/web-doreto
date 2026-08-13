import mitt from "mitt";

export default defineNuxtPlugin(() => {
  const emitter = mitt();

  return {
    provide: {
      event: emitter.emit,
      listen: emitter.on,
      // Cần $off để hủy đăng ký khi component unmount, tránh handler nhân bản
      // (mitt sống suốt vòng đời app) mỗi lần layout mount lại → rò bộ nhớ.
      off: emitter.off,
    },
  };
});
