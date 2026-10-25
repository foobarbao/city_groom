<script setup lang="ts">
/**
 * One level of the side menu: items (links) and folding groups, rendered
 * recursively for nested groups.
 *
 * Props:
 * - `nodes`: entries of this level.
 * - `depth`: 0 for the top level (indentation).
 * - `route`: name of the current route.
 * - `open`: ids of the unfolded groups.
 * - `shop`: current shop code, for merchant links.
 * - `badges`: counters by badge kind.
 *
 * Events:
 * - `toggle(id)`: a group is folded or unfolded.
 * - `navigate`: a link was followed (closes the menu on small screens).
 */
import { IonIcon } from '@ionic/vue'
import { chevronDownOutline } from 'ionicons/icons'
import { useI18n } from 'vue-i18n'

import { type NavBadge, type NavNode, matches, trail } from '../navigation'

const props = defineProps<{
  nodes: NavNode[]
  depth: number
  route: string
  open: string[]
  shop: string
  badges: Record<NavBadge, number>
}>()
const emit = defineEmits<{ toggle: [id: string]; navigate: [] }>()
const { t } = useI18n()

/** A folded group still shows that it contains the current page. */
const containsCurrent = (node: NavNode): boolean => trail(props.route, [node]).length > 0
</script>

<template>
  <ul class="nav-list" :class="`depth-${depth}`">
    <li v-for="node in nodes" :key="node.id">
      <router-link
        v-if="node.kind === 'item'"
        class="nav-row"
        :class="{ active: matches(node, route) }"
        :to="{ name: node.route, params: node.shop ? { code: shop } : {} }"
        :aria-current="matches(node, route) ? 'page' : undefined"
        @click="emit('navigate')"
      >
        <ion-icon :icon="node.icon" aria-hidden="true" />
        <span class="label">{{ t(node.label) }}</span>
        <span v-if="node.badge && badges[node.badge]" class="badge">{{ badges[node.badge] }}</span>
      </router-link>
      <template v-else>
        <button
          type="button"
          class="nav-row group"
          :class="{ current: containsCurrent(node) }"
          :aria-expanded="open.includes(node.id)"
          :aria-controls="`nav-${node.id}`"
          @click="emit('toggle', node.id)"
        >
          <ion-icon :icon="node.icon" aria-hidden="true" />
          <span class="label">{{ t(node.label) }}</span>
          <ion-icon
            class="chevron"
            :class="{ up: open.includes(node.id) }"
            :icon="chevronDownOutline"
            aria-hidden="true"
          />
        </button>
        <div v-show="open.includes(node.id)" :id="`nav-${node.id}`">
          <portal-nav-list
            :nodes="node.children"
            :depth="depth + 1"
            :route="route"
            :open="open"
            :shop="shop"
            :badges="badges"
            @toggle="(id: string) => emit('toggle', id)"
            @navigate="emit('navigate')"
          />
        </div>
      </template>
    </li>
  </ul>
</template>

<style scoped>
.nav-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}
/* Nested levels hang from a thin guide line, like a file tree. */
.nav-list:not(.depth-0) {
  margin: 2px 0 4px 21px;
  padding-left: 8px;
  border-left: 1px solid var(--cg-locker-door-edge);
}
.nav-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: var(--cg-radius-s);
  background: none;
  color: var(--cg-ink);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}
.nav-row ion-icon {
  flex: none;
  font-size: 18px;
  color: var(--cg-ink-soft);
}
.nav-row:hover {
  background: var(--cg-surface-soft);
}
.depth-0 > li > .nav-row {
  font-weight: 800;
}
.group.current:not([aria-expanded='true']) {
  background: var(--cg-surface-soft);
}
.nav-row.active {
  background: var(--cg-leaf-soft);
  color: var(--cg-pine);
  font-weight: 800;
}
.nav-row.active ion-icon {
  color: var(--cg-leaf);
}
.label {
  flex: 1;
  min-width: 0;
}
.chevron {
  transition: transform 0.15s ease;
}
.chevron.up {
  transform: rotate(180deg);
}
.badge {
  min-width: 20px;
  padding: 1px 6px;
  border-radius: var(--cg-radius-pill);
  background: var(--cg-sun);
  color: var(--cg-ink);
  font-size: 12px;
  font-weight: 800;
  text-align: center;
}
@media (prefers-reduced-motion: reduce) {
  .chevron {
    transition: none;
  }
}
</style>
