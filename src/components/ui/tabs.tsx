
import React, { useState, ReactNode } from "react";
import "./tabs.css";

interface TabsProps {
  defaultValue?: string;
  children: ReactNode;
}

interface TabsListProps {
  children: ReactNode;
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
}

const TabsContext = React.createContext<{
  active: string;
  setActive: (value: string) => void;
} | null>(null);

export function Tabs({ defaultValue = "", children }: TabsProps) {
  const [active, setActive] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children }: TabsListProps) {
  return <div className="tabs-list">{children}</div>;
}

export function TabsTrigger({ value, children }: TabsTriggerProps) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) return null;
  const { active, setActive } = ctx;
  return (
    <button
      type="button"
      className={`tabs-trigger${active === value ? " active" : ""}`}
      onClick={() => setActive(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children }: TabsContentProps) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) return null;
  return ctx.active === value ? <div>{children}</div> : null;
}
