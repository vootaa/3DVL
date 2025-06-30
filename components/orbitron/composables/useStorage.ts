import { ref, watch, type Ref } from 'vue'

export function useStorage<T>(
  key: string,
  defaultValue: T,
  storage: Storage = localStorage
): [Ref<T>, (value: T) => void] {
  let initialValue = defaultValue;
  if (import.meta.client) {
    const storedValue = storage.getItem(key)
    initialValue = storedValue ? JSON.parse(storedValue) : defaultValue
  }
  
  const state = ref<T>(initialValue) as Ref<T>
  
  const setValue = (value: T) => {
    if (import.meta.client) {
      state.value = value
      storage.setItem(key, JSON.stringify(value))
    }
  }
  
  // Watch for external changes
  watch(state, (newValue) => {
    if (import.meta.client) {
      storage.setItem(key, JSON.stringify(newValue))
    }
  }, { deep: true })
  
  return [state, setValue]
}

export function useSessionStorage<T>(key: string, defaultValue: T) {
  return useStorage(key, defaultValue, sessionStorage)
}

export function usePersistedRef<T>(key: string, defaultValue: T): Ref<T> {
  const [state] = useStorage(key, defaultValue)
  return state
}
