import { createContext, useContext } from 'react';

export const ZenContext = createContext(false);
export const useZen = () => useContext(ZenContext);
