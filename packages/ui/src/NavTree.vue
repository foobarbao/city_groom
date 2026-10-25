<script setup lang="ts">
/**
 * One level of a side menu (navTree.ts): items (links) and folding groups,
 * rendered recursively for nested groups. Shared by the customer app and
 * the partner portal (docs/DESIGN.md "Navigation").
 *
 * Props:
 * - `nodes`: entries of this level.
 * - `depth`: 0 for the top level (indentation).
 * - `route`: name of the current route.
 * - `open`: ids of the unfolded groups.
 * - `params`: route parameters available to items (`NavItem.paramKeys`).
 * - `badges`: counters by badge key.
 * - `translate`: turns a label key into text (the app's i18n).
 *
 * Events:
 * - `toggle(id)`: a group is folded or unfolded.
 * - `navigate`: a link was followed (closes the menu on small screens).
 */
import { IonIcon } from "@ionic/vue";
import { chevronDownOutline } from "ionicons/icons";

import {
  type NavItem,
  type NavNode,
  matchesRoute as matches,
  navTrail,
} from "./navTree";

const props = defineProps<{
  nodes: NavNode[];
  depth: number;
  route: string;
  open: string[];
  params: Record<string, string>;
  badges: Record<string, number>;
  translate: (key: string) => string;
}>();
const emit = defineEmits<{ toggle: [id: string]; navigate: [] }>();
const t = (key: string): string => props.translate(key);

/** A folded group still shows that it contains the current page. */
const containsCurrent = (node: NavNode): boolean =>
  navTrail([node], props.route).length > 0;

/** Parameters of an item's route, taken from the current context. */
const paramsOf = (node: NavItem): Record<string, string> =>
  Object.fromEntries(
    (node.paramKeys ?? []).map((key) => [key, props.params[key] ?? ""]),
  );
</script>

<template>
  <ul class="nav-list" :class="`depth-${depth}`">
    <li v-for="node in nodes" :key="node.id">
      <router-link
        v-if="node.kind === 'item'"
        class="nav-row"
        :class="{ active: matches(node, route) }"
        :to="{ name: node.route, params: paramsOf(node) }"
        :aria-current="matches(node, route) ? 'page' : undefined"
        @click="emit('navigate')"
      >
        <ion-icon :icon="node.icon" aria-hidden="true" />
        <span class="label">{{ t(node.label) }}</span>
        <span v-if="node.badge && badges[node.badge]" class="badge">{{
          badges[node.badge]
        }}</span>
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
          <nav-tree
            :nodes="node.children"
            :depth="depth + 1"
            :route="route"
            :open="open"
            :params="params"
            :badges="badges"
            :translate="translate"
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
  font-weight: 600;
}
.group.current:not([aria-expanded="true"]) {
  background: var(--cg-surface-soft);
}
.nav-row.active {
  background: var(--cg-leaf-soft);
  color: var(--cg-pine);
  font-weight: 600;
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
  font-weight: 600;
  text-align: center;
}
@media (prefers-reduced-motion: reduce) {
  .chevron {
    transition: none;
  }
}
</style>
