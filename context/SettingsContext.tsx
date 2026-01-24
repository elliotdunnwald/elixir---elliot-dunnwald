
import React, { createContext, useContext, useState, useEffect } from 'react';

type TempUnit = 'C' | 'F';
type MassUnit = 'g' | 'ml';

interface SettingsContextType {
  tempUnit: TempUnit;
  massUnit: MassUnit;
  setTempUnit: (unit: TempUnit) => void;
  setMassUnit: (unit: MassUnit) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tempUnit, setTempUnit] = useState<TempUnit>('C');
  const [massUnit, setMassUnit] = useState<MassUnit>('g');

  return (
    <SettingsContext.Provider value={{ tempUnit, massUnit, setTempUnit, setMassUnit }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
