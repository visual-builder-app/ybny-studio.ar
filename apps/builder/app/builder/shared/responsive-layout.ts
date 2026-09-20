import { atom, computed, onMount } from "nanostores";
import { $settings } from "./client-settings";

export const compactEditorMediaQuery = "(max-width: 899px)";
export const minimumEditorViewportWidth = 320;

// This describes the editor shell only; it never changes the canvas direction
// or the user's persisted docking and panel-width preferences.
export const $isCompactEditor = atom(false);
export const $isCompactInspectorOpen = atom(false);

onMount($isCompactEditor, () => {
  if (typeof window === "undefined") {
    return;
  }
  const media = window.matchMedia(compactEditorMediaQuery);
  const update = () => {
    $isCompactEditor.set(media.matches);
    if (!media.matches) {
      $isCompactInspectorOpen.set(false);
    }
  };
  update();
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
});

export const $effectiveNavigatorLayout = computed(
  [$settings, $isCompactEditor],
  (settings, isCompact) => isCompact ? "docked" : settings.navigatorLayout
);
