<template>
  <div>
    <AtomsFormItem
      v-for="item in inputs"
      :key="item.name"
      :label="item.label"
      :required="item.required"
      :error-message="formErrors[item.name]"
    >
      <AtomsFormInput
        v-model="form[item.name as keyof typeof form]"
        :type="item.type"
        :placeholder="item.placeholder"
        :error="formErrors[item.name]"
      />
    </AtomsFormItem>
  </div>
</template>

<script lang="ts" setup>
import type { TSignupDto } from "~/types/auth.type";
import { normalizeVnPhoneNumber, validateVnPhoneNumber } from "~/utils/phone.utils";

const { signup } = useAuthStore();
const form = reactive<TSignupDto>({
  name: "",
  phone: "",
  password: "",
});

const formErrors = ref<Record<string, string>>({
  name: "",
  phone: "",
  password: "",
});

const inputs = [
  {
    name: "name",
    label: "Họ và tên",
    type: "text",
    placeholder: "Nguyễn Văn A",
    required: true,
  },
  {
    name: "phone",
    label: "Số điện thoại",
    type: "tel",
    placeholder: "0912345678",
    required: true,
  },
  {
    name: "password",
    label: "Mật khẩu",
    type: "password",
    placeholder: "Mật khẩu",
    required: true,
  },
];

// * METHODS
const validateForm = () => {
  const errors: Record<string, string> = {};

  if (!form.name.trim()) {
    errors.name = "Họ và tên là bắt buộc";
  } else if (form.name.trim().length < 2) {
    errors.name = "Họ và tên phải có ít nhất 2 ký tự";
  }

  const phoneError = validateVnPhoneNumber(form.phone);
  if (phoneError) {
    errors.phone = phoneError;
  }

  if (!form.password) {
    errors.password = "Mật khẩu là bắt buộc";
  } else if (form.password.length < 6) {
    errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
  }

  return errors;
};

const submit = async () => {
  const errors = validateForm();
  formErrors.value = {};

  if (Object.keys(errors).length) {
    formErrors.value = errors;
    return;
  }

  const payload: TSignupDto = {
    name: form.name.trim(),
    phone: normalizeVnPhoneNumber(form.phone),
    password: form.password,
  };

  const isSignedUp = await signup(payload);
  return isSignedUp;
};

defineExpose({
  submit,
});
</script>
