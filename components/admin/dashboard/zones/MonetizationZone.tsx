import React, { useState } from 'react';
import { Banknote, CreditCard, Tag, Ticket, Save, Plus, Trash2, Edit3, Video, Search } from 'lucide-react';
import { SystemSettings, SubscriptionPlan, CreditPackage } from '../../../types';
import { saveSystemSettings } from '../../../../firebase';
import { storage } from '../../../../utils/storage';

export const MonetizationZone = (props: any) => {
    const [activeTab, setActiveTab] = useState('PLANS');
    const [settings, setSettings] = useState<SystemSettings>(props.settings || {});

    const updateSettings = (newSettings: Partial<SystemSettings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        props.onUpdateSettings?.(updated);
        saveSystemSettings(updated); // Sync to Cloud
    };

    return (
        <div className="space-y-6">
            {/* Tab Nav */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <button onClick={() => setActiveTab('PLANS')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'PLANS' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                    <CreditCard size={16} /> Subscription Plans
                </button>
                <button onClick={() => setActiveTab('PACKAGES')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'PACKAGES' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                    <Banknote size={16} /> Credit Packages
                </button>
                <button onClick={() => setActiveTab('PRICING')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'PRICING' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                    <Tag size={16} /> Pricing & Fees
                </button>
                <button onClick={() => setActiveTab('CODES')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'CODES' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                    <Ticket size={16} /> Promo Codes
                </button>
            </div>

            {activeTab === 'PLANS' && <PlansManager settings={settings} onUpdate={updateSettings} />}
            {activeTab === 'PACKAGES' && <PackagesManager settings={settings} onUpdate={updateSettings} />}
            {activeTab === 'PRICING' && <PricingManager settings={settings} onUpdate={updateSettings} />}
            {activeTab === 'CODES' && (
                <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-300 text-center">
                    <Ticket size={48} className="text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-500">Promo Code Manager</h3>
                    <p className="text-xs text-slate-400">Coming soon. Use Legacy Dashboard for now.</p>
                </div>
            )}
        </div>
    );
};

const PlansManager = ({ settings, onUpdate }: { settings: SystemSettings, onUpdate: (s: Partial<SystemSettings>) => void }) => {
    const plans = settings.subscriptionPlans || [];

    const handleDelete = (idx: number) => {
        if(!confirm("Delete plan?")) return;
        const updated = plans.filter((_, i) => i !== idx);
        onUpdate({ subscriptionPlans: updated });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan, idx) => (
                <div key={plan.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group">
                    <button onClick={() => handleDelete(idx)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                    </button>
                    <div className="mb-4">
                        <h4 className="text-lg font-black text-slate-800">{plan.name}</h4>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{plan.duration}</p>
                    </div>
                    
                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                            <span className="text-xs font-bold text-blue-800">BASIC</span>
                            <span className="font-black text-blue-600">₹{plan.basicPrice}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl">
                            <span className="text-xs font-bold text-purple-800">ULTRA</span>
                            <span className="font-black text-purple-600">₹{plan.ultraPrice}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {plan.features?.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> {f}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            
            <button className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all min-h-[300px]">
                <Plus size={32} />
                <span className="font-bold text-sm">Add New Plan</span>
            </button>
        </div>
    );
};

const PackagesManager = ({ settings, onUpdate }: { settings: SystemSettings, onUpdate: (s: Partial<SystemSettings>) => void }) => {
    const packages = settings.packages || [];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {packages.map((pkg, idx) => (
                <div key={pkg.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <h4 className="font-bold text-slate-800 mb-1">{pkg.name}</h4>
                    <p className="text-2xl font-black text-indigo-600 my-2">{pkg.credits} CR</p>
                    <p className="text-xs font-bold text-slate-500">Price: ₹{pkg.price}</p>
                </div>
            ))}
             <button className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all min-h-[150px]">
                <Plus size={24} />
                <span className="font-bold text-xs">Add Package</span>
            </button>
        </div>
    );
};

const PricingManager = ({ settings, onUpdate }: { settings: SystemSettings, onUpdate: (s: Partial<SystemSettings>) => void }) => {
    const prices = [
        { key: 'defaultVideoCost', label: 'Default Video Cost', icon: Video },
        { key: 'defaultPdfCost', label: 'Default PDF Cost', icon: Banknote },
        { key: 'mcqTestCost', label: 'MCQ Test Entry', icon: Ticket },
        { key: 'mcqAnalysisCost', label: 'MCQ Analysis', icon: Search },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {prices.map((p) => (
                <div key={p.key} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">{p.label}</p>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            // @ts-ignore
                            value={settings[p.key] || 0}
                            onChange={(e) => onUpdate({ [p.key]: Number(e.target.value) })}
                            className="w-full text-2xl font-black text-slate-800 bg-transparent outline-none border-b border-slate-100 focus:border-indigo-500 transition-colors pb-1"
                        />
                        <span className="text-xs font-bold text-slate-400">CR</span>
                    </div>
                </div>
            ))}
        </div>
    );
};
