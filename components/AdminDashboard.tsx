import React, { useState, useEffect } from 'react';
import { User, SystemSettings, ViewState } from '../types';
import { AdminSidebar } from './admin/dashboard/AdminSidebar';
import { AdminHeader } from './admin/dashboard/AdminHeader';
import { AiZone } from './admin/dashboard/zones/AiZone';
import { UsersZone } from './admin/dashboard/zones/UsersZone';
import { ContentZone } from './admin/dashboard/zones/ContentZone';
import { MonetizationZone } from './admin/dashboard/zones/MonetizationZone';
import { SystemZone } from './admin/dashboard/zones/SystemZone';
import { AnalyticsZone } from './admin/dashboard/zones/AnalyticsZone';
import { checkFirebaseConnection, subscribeToUsers } from '../firebase';

interface Props {
  onNavigate: (view: ViewState) => void;
  settings?: SystemSettings;
  onUpdateSettings?: (s: SystemSettings) => void;
  onImpersonate?: (user: User) => void;
  logActivity: (action: string, details: string) => void;
  user?: User; 
  isDarkMode?: boolean;
  onToggleDarkMode?: (v: boolean) => void;
}

export const AdminDashboard: React.FC<Props> = (props) => {
    const [activeZone, setActiveZone] = useState<string>('USERS');
    const [onlineCount, setOnlineCount] = useState(0);
    const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

    useEffect(() => {
        setIsFirebaseConnected(checkFirebaseConnection());
        const unsub = subscribeToUsers((users) => {
             if (!users) return;
             const count = users.filter(u => {
                if (!u.lastActiveTime) return false;
                return (Date.now() - new Date(u.lastActiveTime).getTime()) < 5 * 60 * 1000;
            }).length;
            setOnlineCount(count);
        });
        return () => unsub();
    }, []);

    const handleForceUpdate = () => {
        if(confirm("Force Update?")) {
            alert("Update Signal Sent");
        }
    };

    const handleSaveSettings = () => {
        alert("Global Settings Saved");
    };

    const renderZone = () => {
        switch(activeZone) {
            case 'AI': return <AiZone />;
            case 'USERS': return <UsersZone {...props} />;
            case 'CONTENT': return <ContentZone {...props} />;
            case 'MONETIZATION': return <MonetizationZone {...props} />;
            case 'SYSTEM': return <SystemZone {...props} />;
            case 'ANALYTICS': return <AnalyticsZone {...props} />;
            default: return <UsersZone {...props} />;
        }
    };

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <AdminSidebar activeZone={activeZone} onZoneChange={setActiveZone} />
            <div className="flex-1 ml-64 p-6">
                <AdminHeader 
                    onlineCount={onlineCount}
                    isFirebaseConnected={isFirebaseConnected}
                    isDarkMode={props.isDarkMode || false}
                    onToggleDarkMode={props.onToggleDarkMode || (() => {})}
                    onForceUpdate={handleForceUpdate}
                    onSaveSettings={handleSaveSettings}
                />
                {renderZone()}
            </div>
        </div>
    );
};
