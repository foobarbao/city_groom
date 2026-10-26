/**
 * @file Navigation tree shared by the CityPal frontends: a folding side menu
 * with nested entries (docs/DESIGN.md "Navigation"). Each app describes its
 * own tree; `NavTree.vue` renders it.
 *
 * Three levels at most: area → item or group → item. Labels are i18n keys of
 * the app, translated by the `translate` function it gives to `NavTree`.
 */

/** A link to a page. */
export interface NavItem {
  kind: "item";
  id: string;
  label: string;
  /** Ionicons icon (SVG data URL from `ionicons/icons`). */
  icon: string;
  /** Route name. */
  route: string;
  /** Route parameters taken from the current context (e.g. `code`, the shop). */
  paramKeys?: string[];
  /** Other route names highlighting this item (e.g. a detail page). */
  also?: string[];
  /** Key of the counter shown next to the item, if any. */
  badge?: string;
  /** Label key of a short status shown next to the item (e.g. "Bientôt"). */
  tag?: string;
}

/** A folding group of entries. */
export interface NavGroup {
  kind: "group";
  id: string;
  label: string;
  icon: string;
  children: NavNode[];
}

export type NavNode = NavItem | NavGroup;

/** Builds an item. */
export const navItem = (
  id: string,
  label: string,
  icon: string,
  route: string,
  extra: Partial<NavItem> = {},
): NavItem => ({ kind: "item", id, label, icon, route, ...extra });

/** Builds a group. */
export const navGroup = (
  id: string,
  label: string,
  icon: string,
  children: NavNode[],
): NavGroup => ({ kind: "group", id, label, icon, children });

/** Whether an item stands for the given route. */
export const matchesRoute = (node: NavItem, route: string): boolean =>
  node.route === route || (node.also ?? []).includes(route);

/**
 * Path from the top of the tree to the item of a route (groups, then the
 * item), or an empty list when the route is not in the tree.
 */
export function navTrail(nodes: NavNode[], route: string): NavNode[] {
  for (const node of nodes) {
    if (node.kind === "item") {
      if (matchesRoute(node, route)) return [node];
    } else {
      const below = navTrail(node.children, route);
      if (below.length) return [node, ...below];
    }
  }
  return [];
}

/** Every label key of a tree, tags included (to check them against the app's messages). */
export function navLabels(nodes: NavNode[]): string[] {
  return nodes.flatMap((n) => [
    n.label,
    ...(n.kind === "item" && n.tag ? [n.tag] : []),
    ...(n.kind === "group" ? navLabels(n.children) : []),
  ]);
}

/** Depth of a tree (1 for a flat list). */
export function navDepth(nodes: NavNode[]): number {
  return Math.max(
    0,
    ...nodes.map((n) => 1 + (n.kind === "group" ? navDepth(n.children) : 0)),
  );
}
