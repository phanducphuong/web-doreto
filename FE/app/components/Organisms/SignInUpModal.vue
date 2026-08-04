<template>
  <MoleculesCommonModal ref="modalRef" :header="formTypeLabel" :is-show-close="true">
    <component ref="formCompRef" :is="currentForm" class="space-y-4" />

    <p class="text-(center sm) mt-4">
      {{ formTypeLabel === "Đăng nhập" ? "Bạn chưa có tài khoản ?" : "Bạn đã có tài khoản ?" }}
      <span
        class="text-primary font-semibold cursor-pointer block w-fit mx-auto hover:underline mt-1"
        @click="switchFormType"
      >
        {{ formTypeLabel === "Đăng nhập" ? "Đăng ký" : "Đăng nhập" }}
      </span>
    </p>

    <template #footer>
      <div class="flex items-center justify-between gap-4">
        <AtomsButton type="outline" @click="modalRef?.closeModal()" :icon="X"> Đóng </AtomsButton>
        <AtomsButton
          type="primaryGradient"
          @click="onSubmit"
          :is-loading="loading"
          :disabled="loading"
          :icon="Check"
        >
          {{ formTypeLabel }}
        </AtomsButton>
      </div>
    </template>
  </MoleculesCommonModal>
</template>

<script setup lang="ts">
import { X, Check } from "lucide-vue-next";
import MoleculesCommonModal from "~/components/molecules/common/Modal.vue";
import MoleculesAuthSignInForm from "~/components/molecules/auth/SignInForm.vue";
import MoleculesAuthSignUpForm from "~/components/molecules/auth/SignUpForm.vue";

const { $listen } = useNuxtApp();
const modalRef = ref<InstanceType<typeof MoleculesCommonModal>>();
const formType = ref<"sign-in" | "sign-up">("sign-in");
const formCompRef = ref<
  InstanceType<typeof MoleculesAuthSignInForm> | InstanceType<typeof MoleculesAuthSignUpForm>
>();
const toast = useToast();
const loading = ref(false);

// * METHODS
const onSubmit = async () => {
  try {
    loading.value = true;
    const isSuccess = await formCompRef.value?.submit();
    if (isSuccess) {
      modalRef.value?.closeModal();
    }
  } catch (error) {
    console.error(error);
    toast.error({ message: `${formTypeLabel.value} thất bại` });
  } finally {
    loading.value = false;
  }
};

const switchFormType = () => {
  formType.value = formType.value === "sign-in" ? "sign-up" : "sign-in";
};

// * COMPUTED
const formTypeLabel = computed(() => {
  return formType.value === "sign-in" ? "Đăng nhập" : "Đăng ký";
});

const currentForm = computed(() => {
  return formType.value === "sign-in" ? MoleculesAuthSignInForm : MoleculesAuthSignUpForm;
});

onMounted(() => {
  $listen("auth:open-sign-modal", (data) => {
    const type = data.type;
    formType.value = type;

    modalRef.value?.openModal();
  });
});
</script>
