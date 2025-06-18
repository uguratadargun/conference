# LiveKit Context Refactoring

This directory contains the refactored LiveKit context implementation, broken down into smaller, more maintainable modules.

## Structure

### Core Context

- `LiveKitContext.tsx` - Main context provider, now much smaller and focused

### Configuration

- `config/livekit.ts` - LiveKit configuration and constants

### Types

- `types/livekit.ts` - TypeScript interfaces and types

### Utilities

- `utils/livekit-token.ts` - Token generation functionality
- `utils/audio-utils.ts` - Audio management utilities
- `utils/room-event-handlers.ts` - Room event handler setup

### Hooks

- `hooks/useDeviceManagement.ts` - Device management functionality
- `hooks/useAudioInteraction.ts` - Audio user interaction management

## Benefits of Refactoring

1. **Separation of Concerns**: Each module has a single responsibility
2. **Maintainability**: Easier to find and modify specific functionality
3. **Testability**: Smaller modules are easier to unit test
4. **Reusability**: Hooks and utilities can be reused in other components
5. **Code Organization**: Clear structure makes navigation easier
6. **Reduced Complexity**: Main context is now ~200 lines instead of ~1000

## Usage

The public API remains the same:

```tsx
import { useLiveKit } from './context/LiveKitContext';

const Component = () => {
  const { roomState, connect, toggleVideo, toggleAudio } = useLiveKit();
  // ... use as before
};
```

## Key Changes

- Extracted all event handlers into `room-event-handlers.ts`
- Moved device management to a custom hook
- Created audio utilities for better audio handling
- Separated token generation logic
- Added proper TypeScript types
- Improved error handling and state management
