import React from 'react';
import '@admin/styles/dos.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dos dos-body">
      <div className="min-h-screen p-4">
        <div className="dos-panel">
          <div className="dos-title p-3">ADMIN</div>
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}


