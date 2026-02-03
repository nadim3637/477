import React, { useState, useEffect } from 'react';
import { Settings, Power, RotateCcw, AlertTriangle, Shield, Activity, RefreshCw, Trash2 } from 'lucide-react';
import { SystemSettings, RecycleBinItem } from '../../../types';
import { saveSystemSettings, rtdb } from '../../../../firebase';
import { storage } from '../../../../utils/storage';
import { set, ref } from 'firebase/database';

export const SystemZone = (props: any) => {
    const [activeTab, setActiveTab] = useState('GENERAL');
    const [settings, setSettings] = useState<SystemSettings>(props.settings || {});
    const [recycleBin, setRecycleBin] = useState<RecycleBinItem[]>([]);

    useEffect(() => {
        loadRecycleBin();
    }, []);

    const loadRecycleBin = async () => {
        const binStr = await storage.getItem('nst_recycle_bin');
        if (binStr) {
            setRecycleBin(typeof binStr === 'string' ? JSON.parse(binStr) : binStr);
        }
    };

    const updateSettings = (newSettings: Partial<SystemSettings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        props.onUpdateSettings?.(updated);
        saveSystemSettings(updated);
    };

    const handleForceUpdate = () => {
        if(confirm("⚠️ FORCE UPDATE ALL APPS?\n\nThis will trigger a reload on all student devices.")) {
            const ts = Date.now().toString();
            updateSettings({ latestVersion: `v${ts}` }); // Simple version bump
            alert("Update Signal Sent!");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
                <button onClick={() => setActiveTab('GENERAL')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'GENERAL' ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                    <Settings size={16} /> General Config
                </button>
                <button onClick={() => setActiveTab('FEATURES')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'FEATURES' ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                    <Power size={16} /> Feature Flags
                </button>
                <button onClick={() => setActiveTab('RECYCLE')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'RECYCLE' ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                    <RotateCcw size={16} /> Recycle Bin
                </button>
            </div>

            {activeTab === 'GENERAL' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Shield size={20} className="text-red-600" /> Danger Zone
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                                <div>
                                    <p className="font-bold text-red-800">Maintenance Mode</p>
                                    <p className="text-xs text-red-600">Blocks all student access.</p>
                                </div>
                                <button 
                                    onClick={() => updateSettings({ maintenanceMode: !settings.maintenanceMode })}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.maintenanceMode ? 'bg-red-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            <button onClick={handleForceUpdate} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2">
                                <RefreshCw size={16} /> Force App Update
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4">App Info</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">App Name</label>
                                <input 
                                    type="text" 
                                    value={settings.appName || ''} 
                                    onChange={e => updateSettings({ appName: e.target.value })}
                                    className="w-full p-3 border rounded-xl font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Support Email</label>
                                <input 
                                    type="text" 
                                    value={settings.supportEmail || ''} 
                                    onChange={e => updateSettings({ supportEmail: e.target.value })}
                                    className="w-full p-3 border rounded-xl font-bold"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'FEATURES' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6">Feature Toggles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { key: 'isChatEnabled', label: 'Public Chat' },
                            { key: 'isGameEnabled', label: 'Spin Wheel Game' },
                            { key: 'isPaymentEnabled', label: 'Payment System' },
                            { key: 'allowSignup', label: 'New Signups' },
                            { key: 'isCompetitionModeEnabled', label: 'Competition Mode' },
                            { key: 'isAiEnabled', label: 'AI Features' },
                        ].map((feat) => (
                            <div key={feat.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="font-bold text-slate-700 text-sm">{feat.label}</span>
                                <button 
                                    // @ts-ignore
                                    onClick={() => updateSettings({ [feat.key]: !settings[feat.key] })}
                                    // @ts-ignore
                                    className={`w-10 h-5 rounded-full relative transition-colors ${settings[feat.key] !== false ? 'bg-green-500' : 'bg-slate-300'}`}
                                >
                                    {/* @ts-ignore */}
                                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all shadow-sm ${settings[feat.key] !== false ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'RECYCLE' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Recycle Bin</h3>
                    {recycleBin.length === 0 ? (
                        <p className="text-center text-slate-400 py-10">Bin is empty.</p>
                    ) : (
                        <div className="space-y-2">
                            {recycleBin.map(item => (
                                <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                    <div>
                                        <p className="font-bold text-slate-800">{item.name}</p>
                                        <p className="text-xs text-slate-500 uppercase">{item.type} • {new Date(item.deletedAt).toLocaleDateString()}</p>
                                    </div>
                                    <button className="text-red-500 hover:text-red-700 font-bold text-xs bg-red-50 px-3 py-2 rounded-lg">
                                        Delete Forever
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
