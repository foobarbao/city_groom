/**
 * @file Test configuration: a browser-like environment for the offers stored
 * in `localStorage`.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({ test: { environment: "jsdom" } });
