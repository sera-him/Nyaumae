import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface OverloadContextType {
  active: boolean;
  toggle: () => void;
  activate: () => void;
  deactivate: () => void;
}

const OverloadContext = createContext<OverloadContextType>({
  active: false,
  toggle: () => {},
  activate: () => {},
  deactivate: () => {},
});

export function OverloadProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const toggle = useCallback(() => setActive(p => !p), []);
  const activate = useCallback(() => setActive(true), []);
  const deactivate = useCallback(() => setActive(false), []);
  return (
    <OverloadContext.Provider value={{ active, toggle, activate, deactivate }}>
      {children}
    </OverloadContext.Provider>
  );
}

export function useOverload() {
  return useContext(OverloadContext);
}
