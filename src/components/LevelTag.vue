<script setup>
/** 把参考区间判定结果渲染成彩色徽标 */
defineProps({
  level: { type: Object, required: true }, // { label, tone }
})
</script>

<template>
  <span class="tag" :class="`tag-${level.tone}`">{{ level.label }}</span>
</template>
