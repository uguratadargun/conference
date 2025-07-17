/** @public */
export type BackgroundEffectType = 'none' | 'blur' | 'virtual';
/** @public */
export interface BackgroundEffectOptions {
    /** The blur radius when using blur effect (5-25) */
    blurRadius?: number;
}
/** @public */
export interface UseBackgroundEffectsOptions {
    /** Initial effect type */
    initialEffect?: BackgroundEffectType;
    /** Initial blur radius */
    initialBlurRadius?: number;
    /** Debounce delay in milliseconds for blur radius changes (default: 500ms) */
    blurDebounceMs?: number;
}
/** @public */
export interface UseBackgroundEffectsReturn {
    /** Current active effect type */
    activeEffect: BackgroundEffectType;
    /** Whether an effect is currently being processed */
    isProcessing: boolean;
    /** Any error that occurred while applying effects */
    error: string | null;
    /** Whether background effects are supported in this browser */
    isSupported: boolean;
    /** Current blur radius setting (immediate UI value) */
    blurRadius: number;
    /** The blur radius that's currently being applied/processed */
    appliedBlurRadius: number;
    /** Apply a background effect */
    applyEffect: (type: BackgroundEffectType, options?: BackgroundEffectOptions) => Promise<void>;
    /** Update blur radius (debounced application) */
    setBlurRadius: (radius: number) => void;
    /** Clear any error */
    clearError: () => void;
}
/**
 * Hook for managing background effects (blur and virtual backgrounds) on video tracks.
 *
 * @example
 * ```tsx
 * const {
 *   activeEffect,
 *   isProcessing,
 *   error,
 *   applyEffect,
 *   setBlurRadius
 * } = useBackgroundEffects();
 *
 * // Apply blur effect
 * await applyEffect('blur', { blurRadius: 15 });
 *
 * // Apply virtual background (uses imported ordulu.jpeg)
 * await applyEffect('virtual');
 *
 * // Remove effects
 * await applyEffect('none');
 * ```
 *
 * @public
 */
export declare function useBackgroundEffects(options?: UseBackgroundEffectsOptions): UseBackgroundEffectsReturn;
//# sourceMappingURL=useBackgroundEffects.d.ts.map