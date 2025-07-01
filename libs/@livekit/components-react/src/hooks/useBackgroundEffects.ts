import { useState, useCallback, useEffect, useRef } from 'react';
import {
  BackgroundBlur,
  VirtualBackground,
  supportsBackgroundProcessors,
} from '@livekit/track-processors';
import type { LocalVideoTrack } from 'livekit-client';
import { useLocalParticipant } from './useLocalParticipant';

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
  applyEffect: (
    type: BackgroundEffectType,
    options?: BackgroundEffectOptions
  ) => Promise<void>;
  /** Update blur radius (debounced application) */
  setBlurRadius: (radius: number) => void;
  /** Clear any error */
  clearError: () => void;
}

// Fallback background image (solid color as data URL)
const FALLBACK_BACKGROUND =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

/**
 * Function to try loading background image from multiple locations
 */
async function loadBackgroundImage(): Promise<string> {
  // List of possible paths where the image might be located
  const possiblePaths = [
    '/src/assets/images/ordulu.jpeg', // Vite asset path
    '/assets/images/ordulu.jpeg', // Built asset path
    '/ordulu.jpeg', // Public directory
  ];

  for (const path of possiblePaths) {
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = path;
      });
      return path;
    } catch {
      // Continue to next path
    }
  }

  throw new Error(
    'Background image not found. Please place ordulu.jpeg in src/assets/images/ or public/ directory.'
  );
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
 * // Apply virtual background (uses ordulu.jpeg if available, otherwise fallback)
 * await applyEffect('virtual');
 *
 * // Remove effects
 * await applyEffect('none');
 * ```
 *
 * @public
 */
export function useBackgroundEffects(
  options: UseBackgroundEffectsOptions = {}
): UseBackgroundEffectsReturn {
  const {
    initialEffect = 'none',
    initialBlurRadius = 10,
    blurDebounceMs = 500,
  } = options;

  const { cameraTrack } = useLocalParticipant();

  const [activeEffect, setActiveEffect] =
    useState<BackgroundEffectType>(initialEffect);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blurRadius, setBlurRadius] = useState(initialBlurRadius);
  const [appliedBlurRadius, setAppliedBlurRadius] = useState(initialBlurRadius);

  // Debounce timeout ref
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser support
  const isSupported = supportsBackgroundProcessors();

  const applyEffect = useCallback(
    async (
      type: BackgroundEffectType,
      effectOptions?: BackgroundEffectOptions
    ) => {
      const localVideoTrack = cameraTrack?.track as LocalVideoTrack;

      if (!localVideoTrack) {
        setError('No video track available');
        return;
      }

      if (!isSupported) {
        setError('Background effects are not supported in this browser');
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        // Stop any existing processor first
        await localVideoTrack.stopProcessor();

        // Apply new effect based on type
        switch (type) {
          case 'blur': {
            const radius = effectOptions?.blurRadius ?? appliedBlurRadius;
            const blurProcessor = BackgroundBlur(radius);
            await localVideoTrack.setProcessor(blurProcessor);
            setAppliedBlurRadius(radius);
            break;
          }

          case 'virtual': {
            let backgroundImageUrl = FALLBACK_BACKGROUND;

            // Try to load the custom image
            try {
              backgroundImageUrl = await loadBackgroundImage();
            } catch (imageError) {
              console.warn(
                'Custom background image not found, using fallback:',
                imageError
              );
              setError(
                'Custom background image not found. Please add "ordulu.jpeg" to src/assets/images/ directory. Using default background for now.'
              );
            }

            const virtualBgProcessor = VirtualBackground(backgroundImageUrl);
            await localVideoTrack.setProcessor(virtualBgProcessor);
            break;
          }

          case 'none':
          default:
            // Processor already stopped above
            break;
        }

        setActiveEffect(type);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to apply background effect';
        console.error('Background effect error:', err);
        setError(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    [cameraTrack, isSupported, appliedBlurRadius]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Debounced blur radius update
  const updateBlurRadius = useCallback(
    (radius: number) => {
      // Update UI immediately
      setBlurRadius(radius);

      // Clear existing timeout
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }

      // Only apply blur effect if blur is currently active, with debounce
      if (activeEffect === 'blur') {
        blurTimeoutRef.current = setTimeout(() => {
          applyEffect('blur', { blurRadius: radius });
        }, blurDebounceMs);
      }
    },
    [activeEffect, applyEffect, blurDebounceMs]
  );

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  // Clean up processor when component unmounts
  useEffect(() => {
    return () => {
      const localVideoTrack = cameraTrack?.track as LocalVideoTrack;
      if (localVideoTrack) {
        localVideoTrack.stopProcessor().catch(console.error);
      }
    };
  }, [cameraTrack]);

  return {
    activeEffect,
    isProcessing,
    error,
    isSupported,
    blurRadius,
    appliedBlurRadius,
    applyEffect,
    setBlurRadius: updateBlurRadius,
    clearError,
  };
}
