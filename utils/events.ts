// Recipe events
export const recipeEvents = {
  listeners: new Set<(recipeId: string) => void>(),
  subscribe: (callback: (recipeId: string) => void) => {
    recipeEvents.listeners.add(callback);
    return () => recipeEvents.listeners.delete(callback);
  },
  emit: (recipeId: string) => {
    recipeEvents.listeners.forEach(callback => callback(recipeId));
  },
  clearListeners: new Set<() => void>(),
  subscribeToClear: (callback: () => void) => {
    recipeEvents.clearListeners.add(callback);
    return () => recipeEvents.clearListeners.delete(callback);
  },
  emitClear: () => {
    recipeEvents.clearListeners.forEach(callback => callback());
  }
};

// User profile events
export const userProfileEvents = {
  listeners: new Set<(profile: any) => void>(),
  subscribe: (callback: (profile: any) => void) => {
    userProfileEvents.listeners.add(callback);
    return () => userProfileEvents.listeners.delete(callback);
  },
  emit: (profile: any) => {
    userProfileEvents.listeners.forEach(callback => callback(profile));
  }
}; 