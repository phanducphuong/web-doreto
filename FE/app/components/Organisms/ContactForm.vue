<template>
  <div class="p-(x-10 y-8) border-(solid third-light/30) rounded-2xl bg-#F6F3F2 space-y-4">
    <div class="w-10 h-10 bg-primary rounded-xl center-child text-white">
      <Sparkles class="size-6" fill="currentColor" stroke-transparent />
    </div>

    <p class="text-2xl font-semibold text-black">Tư vấn miễn phí</p>

    <p class="text-sm text-justify font-medium">
      Bạn chưa biết chọn size hay phối đồ thế nào? Để lại thông tin, tư vấn viên của chúng tôi sẽ
      gợi ý trang phục phù hợp nhất với bạn.
    </p>

    <div class="space-y-5">
      <AtomsFormInput
        v-for="input in inputs"
        :key="input.placeholder"
        v-model="form[input.key]"
        :placeholder="input.placeholder"
        :error="input.error"
        @focus="input.error = ''"
        class="w-full"
      />

      <AtomsButton
        type="primaryGradient"
        class="w-full !py-5"
        :icon="Send"
        :is-loading="isLoading"
        @click="handleSubmit"
      >
        Gửi yêu cầu
      </AtomsButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Sparkles, Send } from "lucide-vue-next";
import {
  useContactRequest,
  validateCreateContactInput,
} from "~/composables/contact-request.composable";

type TFormKey = "name" | "email" | "phone";

type TInputField = {
  placeholder: string;
  error: string;
  key: TFormKey;
};

const form = reactive({
  name: "",
  email: "",
  phone: "",
});

const inputs = reactive([
  {
    placeholder: "Họ và tên",
    error: "",
    key: "name",
  },
  {
    placeholder: "Email",
    error: "",
    key: "email",
  },
  {
    placeholder: "Số điện thoại",
    error: "",
    key: "phone",
  },
] as [TInputField, TInputField, TInputField]);

const isLoading = ref(false);
const { createContact } = useContactRequest();

const applyFieldErrors = (errors: Record<string, string | undefined>) => {
  inputs.forEach((input) => {
    input.error = errors[input.key] ?? "";
  });
};

const handleSubmit = async () => {
  inputs.forEach((input) => (input.error = ""));

  const validated = validateCreateContactInput({
    name: form.name,
    email: form.email,
    phone: form.phone,
  });

  if (!validated.ok) {
    applyFieldErrors(validated.errors);
    return;
  }

  isLoading.value = true;
  try {
    const ok = await createContact(validated.dto);
    if (ok) {
      form.name = "";
      form.email = "";
      form.phone = "";
    }
  } finally {
    isLoading.value = false;
  }
};
</script>
