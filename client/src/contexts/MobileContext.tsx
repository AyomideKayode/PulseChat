import { createContext, useContext, type ReactNode } from 'react';

interface MobileContextValue {
  isMobile: boolean;
  openSidebar: () => void;
}

const MobileContext = createContext<MobileContextValue>({
  isMobile: false,
  openSidebar: () => {},
});

export function MobileProvider({
  isMobile,
  openSidebar,
  children,
}: MobileContextValue & { children: ReactNode }) {
  return (
    <MobileContext.Provider value={{ isMobile, openSidebar }}>
      {children}
    </MobileContext.Provider>
  );
}

export function useMobile(): MobileContextValue {
  return useContext(MobileContext);
}
