/**
 * @file Shared UI of the City Groom frontends: design tokens (import
 * `@city-groom/ui/src/theme.css`), the locker front drawing and its geometry,
 * the folding side menu (NavTree), the CityPal mark (BrandMark) and photo
 * stories (StoryBackdrop, StoryCredits, useStory).
 * See docs/DESIGN.md.
 */
export { default as BrandMark } from "./BrandMark.vue";
export { default as LockerFront } from "./LockerFront.vue";
export * from "./lockerDrawing";
export { downscalePhoto } from "./image";
export { default as NavTree } from "./NavTree.vue";
export * from "./navTree";
export { default as StoryBackdrop } from "./StoryBackdrop.vue";
export { default as StoryCredits } from "./StoryCredits.vue";
export * from "./story";
