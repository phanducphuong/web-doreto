<template>
  <MoleculesCommonModal
    ref="modalRef"
    header="Đánh dấu spam"
    :is-show-close="true"
    :width="480"
    :close-on-click-overlay="false"
  >
    <div v-if="contact" class="space-y-4 text-sm">
      <p class="text-third-light">
        <span class="font-medium text-gray-800">{{ contact.name }}</span>
        <span v-if="contact.email"> · {{ contact.email }}</span>
        <span v-if="contact.phone"> · {{ contact.phone }}</span>
      </p>

      <AtomsFormItem label="Chặn thêm vào danh sách">
        <label class="flex items-center gap-2 py-1">
          <input
            v-model="blockEmail"
            type="checkbox"
            class="size-4 accent-primary"
            :disabled="!hasEmail"
          />
          <span :class="{ 'opacity-50': !hasEmail }">Chặn email</span>
        </label>
        <label class="flex items-center gap-2 py-1">
          <input
            v-model="blockPhone"
            type="checkbox"
            class="size-4 accent-primary"
            :disabled="!hasPhone"
          />
          <span :class="{ 'opacity-50': !hasPhone }">Chặn số điện thoại</span>
        </label>
      </AtomsFormItem>
    </div>

    <template #footer>
      <AtomsButton type="outline" :disabled="submitting" @click="closeModal"> Hủy </AtomsButton>
      <AtomsButton type="danger" :is-loading="submitting" :disabled="submitting" @click="onConfirm">
        Đánh dấu spam
      </AtomsButton>
    </template>
  </MoleculesCommonModal>
</template>

<script setup lang="ts">
import type { TContactRequest, TMarkSpamDto } from "~/types/contact-request.type";
import MoleculesCommonModal from "~/components/molecules/common/Modal.vue";

const { submitting = false } = defineProps<{
  submitting?: boolean;
}>();

const emit = defineEmits<{
  (e: "submit", payload: { id: string; body: TMarkSpamDto }): void;
}>();

const toast = useToast();
const modalRef = ref<InstanceType<typeof MoleculesCommonModal>>();
const contact = ref<TContactRequest | null>(null);
const blockEmail = ref(false);
const blockPhone = ref(false);

const hasEmail = computed(() => Boolean(contact.value?.email?.trim()));
const hasPhone = computed(() => Boolean(contact.value?.phone?.trim()));

const openModal = (row: TContactRequest) => {
  contact.value = row;
  blockEmail.value = false;
  blockPhone.value = false;
  nextTick(() => modalRef.value?.openModal());
};

const closeModal = () => {
  modalRef.value?.closeModal();
  contact.value = null;
};

const onConfirm = () => {
  if (!contact.value) return;

  if (!blockEmail.value && !blockPhone.value) {
    toast.error({ message: "Vui lòng chọn ít nhất một tùy chọn chặn" });
    return;
  }

  if (blockEmail.value && !hasEmail.value) {
    toast.error({ message: "Không có email để chặn" });
    return;
  }

  if (blockPhone.value && !hasPhone.value) {
    toast.error({ message: "Không có số điện thoại để chặn" });
    return;
  }

  if (!window.confirm("Bạn có chắc muốn đánh dấu spam cho liên hệ này?")) return;

  emit("submit", {
    id: contact.value._id,
    body: {
      blockEmail: blockEmail.value,
      blockPhone: blockPhone.value,
    },
  });
};

defineExpose({
  openModal,
  closeModal,
});
</script>
