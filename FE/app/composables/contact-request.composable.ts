import type {
  TContactListQueryParams,
  TContactRequest,
  TCreateContactDto,
  TMarkSpamDto,
  TSpamBlock,
  TSpamBlocklistQueryParams,
} from "~/types/contact-request.type";
import type { TTablePagination } from "~/types/table.type";
import { getApiErrorMessage } from "~/utils/api-error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildPagination(
  page: number,
  total: number,
  count: number,
  limit: number,
): TTablePagination {
  const safeLimit = limit || 10;
  return {
    page,
    totalPage: safeLimit ? Math.ceil(total / safeLimit) : 0,
    total,
    count,
  };
}

export function useContactRequest() {
  const toast = useToast();
  const { $contactRequestRepository, $tracking } = useNuxtApp();

  const isFetching = ref(false);
  const listContacts = ref<TContactRequest[]>([]);
  const pagination = ref<TTablePagination>({
    page: 1,
    totalPage: 0,
    total: 0,
    count: 0,
  });

  const markSpamSubmitting = ref(false);

  const fetchContacts = async (params: TContactListQueryParams) => {
    try {
      isFetching.value = true;
      const limit = params.limit ?? 10;
      const res = await $contactRequestRepository.getContacts(params);
      listContacts.value = res.data;
      pagination.value = buildPagination(res.page, res.total, res.count, limit);
    } catch (error) {
      console.error(error);
      toast.error({ message: getApiErrorMessage(error) });
    } finally {
      isFetching.value = false;
    }
  };

  const createContact = async (dto: TCreateContactDto): Promise<boolean> => {
    try {
      // Bơm attribution first-touch (phase 37) — fail-safe: thiếu $tracking → {} → cột null.
      const payload: TCreateContactDto = { ...dto, ...($tracking?.getAttribution() ?? {}) };
      await $contactRequestRepository.createContact(payload);
      // Gửi liên hệ thành công → bắn event funnel thứ 5 (D-05), fire-and-forget.
      $tracking?.trackEvent("contact_form");
      toast.success({ message: "Gửi yêu cầu thành công" });
      return true;
    } catch (error) {
      console.error(error);
      toast.error({ message: getApiErrorMessage(error) });
      return false;
    }
  };

  const setDone = async (id: string, done: boolean): Promise<boolean> => {
    const idx = listContacts.value.findIndex((c) => c._id === id);
    if (idx === -1) return false;

    const prev = listContacts.value[idx] as TContactRequest;
    const snapshot = { ...prev };

    listContacts.value[idx] = {
      ...prev,
      done,
      doneAt: done ? new Date().toISOString() : undefined,
    };

    try {
      await $contactRequestRepository.setDone(id, done);
      toast.success({ message: done ? "Đã đánh dấu hoàn thành" : "Đã hoàn tác trạng thái" });
      return true;
    } catch (error) {
      listContacts.value[idx] = snapshot;
      console.error(error);
      toast.error({ message: getApiErrorMessage(error) });
      return false;
    }
  };

  const markSpam = async (id: string, payload: TMarkSpamDto): Promise<boolean> => {
    try {
      markSpamSubmitting.value = true;
      await $contactRequestRepository.markSpam(id, payload);
      toast.success({ message: "Đã đánh dấu spam" });
      return true;
    } catch (error) {
      console.error(error);
      toast.error({ message: getApiErrorMessage(error) });
      return false;
    } finally {
      markSpamSubmitting.value = false;
    }
  };

  return {
    isFetching,
    listContacts,
    pagination,
    markSpamSubmitting,
    fetchContacts,
    createContact,
    setDone,
    markSpam,
  };
}

export function useSpamBlocklist() {
  const toast = useToast();
  const { $contactRequestRepository } = useNuxtApp();

  const isFetching = ref(false);
  const listSpamBlocks = ref<TSpamBlock[]>([]);
  const pagination = ref<TTablePagination>({
    page: 1,
    totalPage: 0,
    total: 0,
    count: 0,
  });

  const addSubmitting = ref(false);
  const removeSubmittingKey = ref<string | null>(null);

  const fetchSpamList = async (params: TSpamBlocklistQueryParams) => {
    try {
      isFetching.value = true;
      const limit = params.limit ?? 10;
      const res = await $contactRequestRepository.getSpamList(params);
      listSpamBlocks.value = res.data;
      pagination.value = buildPagination(res.page, res.total, res.count, limit);
    } catch (error) {
      console.error(error);
      toast.error({ message: getApiErrorMessage(error) });
    } finally {
      isFetching.value = false;
    }
  };

  const addSpam = async (kind: "email" | "phone", value: string): Promise<boolean> => {
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error({ message: "Giá trị không được để trống" });
      return false;
    }
    try {
      addSubmitting.value = true;
      await $contactRequestRepository.addSpam({ kind, value: trimmed });
      toast.success({ message: "Đã thêm vào danh sách chặn" });
      return true;
    } catch (error) {
      console.error(error);
      toast.error({ message: getApiErrorMessage(error) });
      return false;
    } finally {
      addSubmitting.value = false;
    }
  };

  const blockKey = (b: TSpamBlock) => `${b.kind}:${b.value}`;

  const removeSpam = async (block: TSpamBlock): Promise<boolean> => {
    const key = blockKey(block);
    const prevList = [...listSpamBlocks.value];
    listSpamBlocks.value = listSpamBlocks.value.filter((b) => blockKey(b) !== key);

    try {
      removeSubmittingKey.value = key;
      await $contactRequestRepository.removeSpam(block.kind, block.value);
      toast.success({ message: "Đã gỡ chặn" });
      return true;
    } catch (error) {
      listSpamBlocks.value = prevList;
      console.error(error);
      toast.error({ message: getApiErrorMessage(error) });
      return false;
    } finally {
      removeSubmittingKey.value = null;
    }
  };

  return {
    isFetching,
    listSpamBlocks,
    pagination,
    addSubmitting,
    removeSubmittingKey,
    fetchSpamList,
    addSpam,
    removeSpam,
  };
}

export function validateCreateContactInput(input: {
  name: string;
  email: string;
  phone: string;
}):
  | { ok: true; dto: TCreateContactDto }
  | { ok: false; errors: { name?: string; email?: string; phone?: string } } {
  const name = input.name.trim();
  const email = input.email.trim();
  const phone = input.phone.trim();

  const errors: { name?: string; email?: string; phone?: string } = {};

  if (!name) {
    errors.name = "Họ và tên là bắt buộc";
  }

  const hasEmail = email.length > 0;
  const hasPhone = phone.length > 0;

  if (!hasEmail && !hasPhone) {
    errors.email = "Cần nhập Email hoặc Số điện thoại";
    errors.phone = "Cần nhập Email hoặc Số điện thoại";
  } else {
    if (hasEmail && !EMAIL_RE.test(email)) {
      errors.email = "Email không hợp lệ";
    }
    if (hasPhone && phone.replace(/\s/g, "").length < 8) {
      errors.phone = "Số điện thoại không hợp lệ";
    }
  }

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  const dto: TCreateContactDto = { name };
  if (hasEmail) dto.email = email;
  if (hasPhone) dto.phone = phone;

  return { ok: true, dto };
}
