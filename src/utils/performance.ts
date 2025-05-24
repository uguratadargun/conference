// Performance monitoring utilities

export const measurePerformance = (name: string, fn: () => void) => {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(`${name}-start`);
    fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  } else {
    fn();
  }
};

export const measureAsyncPerformance = async (name: string, fn: () => Promise<any>) => {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(`${name}-start`);
    const result = await fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    return result;
  } else {
    return await fn();
  }
};

// Debounce utility for performance-critical operations
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle utility for performance-critical operations
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Memory cleanup utility
export const scheduleCleanup = (cleanup: () => void, delay: number = 5000) => {
  const timeoutId = setTimeout(cleanup, delay);
  return () => clearTimeout(timeoutId);
};

// RequestAnimationFrame-based scheduling for smooth animations
export const scheduleAnimationFrame = (callback: () => void) => {
  if (typeof requestAnimationFrame !== 'undefined') {
    return requestAnimationFrame(callback);
  } else {
    return setTimeout(callback, 16); // ~60fps fallback
  }
};

// Cancel scheduled animation frame
export const cancelAnimationFrame = (id: number) => {
  if (typeof cancelAnimationFrame !== 'undefined') {
    cancelAnimationFrame(id);
  } else {
    clearTimeout(id);
  }
};

// Performance observer for monitoring
export const observePerformance = () => {
  if (typeof PerformanceObserver !== 'undefined') {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          console.log(`⚡ Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
        }
      });
    });
    
    try {
      observer.observe({ type: 'measure', buffered: true });
      return () => observer.disconnect();
    } catch (e) {
      console.warn('Performance observer not supported');
      return () => {};
    }
  }
  return () => {};
}; 