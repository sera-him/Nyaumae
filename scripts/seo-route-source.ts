/**
 * esbuild entry used by scripts/generate-seo-files.mjs to reuse the app's own
 * routing/metadata logic in Node without duplicating route strings.
 */
export { exportRouteManifest as routeManifest } from '../src/lib/routeManifest';
export { getPageMetadata } from '../src/components/RouteMetadata';
