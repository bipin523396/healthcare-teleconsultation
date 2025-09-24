import React, { ReactNode, useState } from 'react';
import TopNavbar from './TopNavbar';
import SideNavbar from './SideNavbar';
import AIAgentBar from './AIAgentBar';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sideNavOpen, setSideNavOpen] = useState(true);
  const [aiAgentOpen, setAiAgentOpen] = useState(false);

  const toggleAiAgent = () => {
    setAiAgentOpen(!aiAgentOpen);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopNavbar toggleSideNav={() => setSideNavOpen(!sideNavOpen)} />
      <div className="flex flex-1">
        <SideNavbar isOpen={sideNavOpen} onAiAgentClick={toggleAiAgent} />
        <main 
          className={`transition-all duration-300 ease-in-out flex-1 pt-16 
            ${sideNavOpen ? 'md:ml-56' : 'md:ml-16'}`}
        >
          <div className="p-4 md:p-8">{children}</div>
        </main>
        <AIAgentBar isOpen={aiAgentOpen} onToggle={toggleAiAgent} />
      </div>
    </div>
  );
};

export default Layout;