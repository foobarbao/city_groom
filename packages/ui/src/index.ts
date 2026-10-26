/**
 * @file Shared UI of the City Groom frontends: design tokens (import
 * `@city-groom/ui/src/theme.css`), the locker front drawing and its geometry,
 * the folding side menu (NavTree) and the CityPal mark (BrandMark).
 * See docs/DESIGN.md.
 */
export { default as BrandMark } from "./BrandMark.vue";
export { default as LockerFront } from "./LockerFront.vue";
export * from "./lockerDrawing";
export { downscalePhoto } from "./image";
export { default as NavTree } from "./NavTree.vue";
export * from "./navTree";
