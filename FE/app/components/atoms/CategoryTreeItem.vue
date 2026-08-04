<template>
  <div>
    <div
      class="flex gap-4 cursor-pointer hover:text-primary text-sm items-center"
      @click="$emit('on-select-category', category)"
    >
      <!-- <img
        :src="category.icon || defaultCategoryIcon"
        :alt="category.name"
        class="shrink-0 w-7 h-7 object-cover"
        @error="handleErrorImage"
      /> -->

      <AtomsTooltip :content="category.name" :show-after="300">
        <span class="line-clamp-2">
          {{ category.name }} {{ isShowCount ? `(${category.count})` : "" }}
        </span>
      </AtomsTooltip>

      <!-- <AtomsButton
        v-if="!isChild && !isReadOnly"
        type="ghost"
        :icon="Plus"
        @click.stop="$emit('on-add-category', category)"
      /> -->
    </div>

    <!-- <CategoryTreeItem
      v-for="child in category.children"
      class="pl-6 my-3"
      :key="child._id"
      :category="child"
      :is-child="true"
      :is-read-only="isReadOnly"
      @on-add-category="$emit('on-add-category', $event)"
      @on-select-category="$emit('on-select-category', $event)"
    /> -->
  </div>
</template>

<script setup lang="ts">
import type { TExistedCategory } from "~/types/category.type";
import defaultCategoryIcon from "~/assets/images/default-category-icon.png";
import { Plus } from "lucide-vue-next";

const {
  category,
  isChild,
  isShowCount = false,
  isReadOnly = false,
} = defineProps<{
  category: TExistedCategory & { children?: TExistedCategory[]; count?: number };
  isChild?: boolean;
  isShowCount?: boolean;
  isReadOnly?: boolean;
}>();

const emits = defineEmits<{
  (e: "on-add-category", category: TExistedCategory): void;
  (e: "on-select-category", category: TExistedCategory): void;
}>();

const handleErrorImage = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = defaultCategoryIcon;
};
</script>
