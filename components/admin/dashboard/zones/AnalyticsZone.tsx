import React, { useState, useEffect } from 'react';
import { Activity, Users, BrainCircuit, BarChart2, TrendingUp } from 'lucide-react';
import { subscribeToUniversalAnalysis, subscribeToApiUsage, subscribeToUsers } from '../../../../firebase';
import { UniversalAnalysisLog, User } from '../../../types';

export const AnalyticsZone = (props: any) => {
    const [analysisLogs, setAnalysisLogs] = useState<UniversalAnalysisLog[]>([]);
    const [apiStats, setApiStats] = useState<any>(null);
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const unsub1 = subscribeToUniversalAnalysis(setAnalysisLogs);
        const unsub2 = subscribeToApiUsage(setApiStats);
        const unsub3 = subscribeToUsers(setUsers);
        return () => { unsub1(); unsub2(); unsub3(); };
    }, []);

    // Calculate DAU
    const today = new Date().toDateString();
    const dau = users.filter(u => new Date(u.lastLoginDate).toDateString() === today).length;
    
    // Calculate AI Usage
    const totalAiCalls = Object.values(apiStats || {}).reduce((acc: any, val: any) => acc + (typeof val === 'number' ? val : 0), 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl"><Users size={24} /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Daily Active Users</p>
                            <p className="text-3xl font-black text-slate-800">{dau}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-purple-100 text-purple-600 rounded-2xl"><BrainCircuit size={24} /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">AI Requests Today</p>
                            <p className="text-3xl font-black text-slate-800">{totalAiCalls}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-green-100 text-green-600 rounded-2xl"><Activity size={24} /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Analysis Generated</p>
                            <p className="text-3xl font-black text-slate-800">{analysisLogs.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <BarChart2 size={20} /> Latest AI Analysis Logs
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                            <tr>
                                <th className="p-3">Time</th>
                                <th className="p-3">Student</th>
                                <th className="p-3">Topic</th>
                                <th className="p-3">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {analysisLogs.slice(0, 10).map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50">
                                    <td className="p-3 text-slate-500">{new Date(log.date).toLocaleTimeString()}</td>
                                    <td className="p-3 font-bold text-slate-700">{log.userName}</td>
                                    <td className="p-3 text-slate-600">{log.chapter}</td>
                                    <td className="p-3 font-mono font-bold text-blue-600">{log.score}/{log.totalQuestions}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
