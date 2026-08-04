<template>
  <div>
    <AtomsFormItem label="Số điện thoại" :error-message="formErrors.username" required>
      <AtomsFormInput
        v-model="form.username"
        type="tel"
        :error="formErrors.username"
        placeholder="0912345678"
      />
    </AtomsFormItem>
    <AtomsFormItem label="Mật khẩu" :error-message="formErrors.password" required>
      <AtomsFormInput
        v-model="form.password"
        type="password"
        :error="formErrors.password"
        placeholder="Mật khẩu"
      />
    </AtomsFormItem>
  </div>
</template>

<script lang="ts" setup>
import type { TSigninDto } from "~/types/auth.type";
import { normalizeVnPhoneNumber, validateVnPhoneNumber } from "~/utils/phone.utils";

const { signin } = useAuthStore();
const form = reactive<TSigninDto>({
  username: "",
  password: "",
});

const formErrors = ref<any>({
  username: "",
  password: "",
});

// * METHODS
const validateForm = (form: TSigninDto) => {
  const errors: any = {};
  const phoneError = validateVnPhoneNumber(form.username);
  if (phoneError) {
    errors.username = phoneError;
  }
  if (!form.password) {
    errors.password = "Mật khẩu là bắt buộc";
  } else if (form.password.length < 6) {
    errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
  }

  return errors;
};

const submit = async () => {
  const errors = validateForm(form);
  if (Object.keys(errors).length) {
    formErrors.value = errors;
    return;
  }

  const isSignedIn = await signin({
    username: normalizeVnPhoneNumber(form.username),
    password: form.password,
  });
  return isSignedIn;
};

defineExpose({
  submit,
});
</script>
