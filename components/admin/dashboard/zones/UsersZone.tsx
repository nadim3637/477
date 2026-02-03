import React, { useState, useEffect } from 'react';
import { User, Role } from '../../../types';
import { subscribeToUsers, saveUserToLive, rtdb, db } from '../../../../firebase';
import { Search, Trash2, Edit3, Eye, Shield, Activity, MessageSquare, AlertTriangle, UserCheck, UserX, CheckCircle, Smartphone } from 'lucide-react';
import { storage } from '../../../../utils/storage';
import { ref, update, set } from 'firebase/database';
import { deleteDoc, doc } from 'firebase/firestore';

export const UsersZone = (props: any) => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [viewingHistory, setViewingHistory] = useState<User | null>(null);

    useEffect(() => {
        const unsub = subscribeToUsers((u) => {
            if (u) setUsers(u.sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
        });
        return () => unsub();
    }, []);

    const filteredUsers = users.filter(u => 
        (u.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.id || '').includes(searchTerm)
    );

    const handleDelete = async (user: User) => {
        if (!confirm(`Are you sure you want to delete ${user.name}? This moves them to Recycle Bin.`)) return;
        
        // Soft delete logic would go here, replicating Legacy behavior
        // For now, I'll just do a direct Firebase delete simulation or call props.logActivity
        try {
            await deleteDoc(doc(db, "users", user.id));
            props.logActivity?.("USER_DELETE", `Deleted user ${user.id}`);
        } catch (e) {
            console.error(e);
            alert("Delete failed (check console)");
        }
    };

    const handleBan = async (user: User) => {
        const isBanned = user.isLocked;
        if (!confirm(`${isBanned ? 'Unban' : 'Ban'} ${user.name}?`)) return;
        
        const updated = { ...user, isLocked: !isBanned };
        await saveUserToLive(updated);
        props.logActivity?.("USER_BAN", `${isBanned ? 'Unbanned' : 'Banned'} user ${user.id}`);
    };

    const handleRoleChange = async (user: User, newRole: Role) => {
        if (!confirm(`Change role of ${user.name} to ${newRole}?`)) return;
        const updated = { ...user, role: newRole, isSubAdmin: newRole === 'SUB_ADMIN' };
        await saveUserToLive(updated);
    };

    const handleCreditUpdate = async (amount: number) => {
        if (!editingUser) return;
        const updated = { ...editingUser, credits: amount };
        await saveUserToLive(updated);
        setEditingUser(null);
        props.logActivity?.("CREDIT_UPDATE", `Set credits for ${editingUser.name} to ${amount}`);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><UserCheck size={24} /></div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Total Users</p>
                        <p className="text-2xl font-black text-slate-800">{users.length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="p-3 bg-green-100 text-green-600 rounded-xl"><Smartphone size={24} /></div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Active Today</p>
                        <p className="text-2xl font-black text-slate-800">
                            {users.filter(u => new Date(u.lastLoginDate).toDateString() === new Date().toDateString()).length}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><Shield size={24} /></div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Admins</p>
                        <p className="text-2xl font-black text-slate-800">
                            {users.filter(u => u.role === 'ADMIN' || u.role === 'SUB_ADMIN').length}
                        </p>
                    </div>
                </div>
                 <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="p-3 bg-red-100 text-red-600 rounded-xl"><AlertTriangle size={24} /></div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Banned</p>
                        <p className="text-2xl font-black text-slate-800">
                            {users.filter(u => u.isLocked).length}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-slate-800">User Management</h3>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search users..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                            <tr>
                                <th className="p-4">User</th>
                                <th className="p-4">Credits</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.slice(0, 50).map(u => (
                                <tr key={u.id} className="hover:bg-slate-50">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                                {u.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{u.name}</p>
                                                <p className="text-xs text-slate-400 font-mono">{u.email || u.mobile}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 font-bold text-blue-600">{u.credits}</td>
                                    <td className="p-4">
                                        <select 
                                            value={u.role}
                                            onChange={(e) => handleRoleChange(u, e.target.value as Role)}
                                            className="bg-transparent font-bold text-xs uppercase outline-none cursor-pointer hover:text-indigo-600"
                                        >
                                            <option value="STUDENT">Student</option>
                                            <option value="SUB_ADMIN">Sub-Admin</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </td>
                                    <td className="p-4">
                                        {u.isLocked ? (
                                            <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold">Banned</span>
                                        ) : (
                                            <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-bold">Active</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button onClick={() => setEditingUser(u)} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg"><Edit3 size={16} /></button>
                                        <button onClick={() => handleBan(u)} className="p-2 text-slate-400 hover:text-orange-600 bg-slate-50 rounded-lg"><AlertTriangle size={16} /></button>
                                        <button onClick={() => props.onImpersonate?.(u)} className="p-2 text-slate-400 hover:text-green-600 bg-slate-50 rounded-lg"><Eye size={16} /></button>
                                        <button onClick={() => handleDelete(u)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 rounded-lg"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl">
                        <h3 className="text-lg font-bold mb-4">Edit {editingUser.name}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Credits</label>
                                <input 
                                    type="number" 
                                    value={editingUser.credits} 
                                    onChange={(e) => setEditingUser({...editingUser, credits: Number(e.target.value)})}
                                    className="w-full p-3 border rounded-xl font-bold"
                                />
                            </div>
                            {/* Add more fields as needed */}
                            <div className="flex gap-2 mt-4">
                                <button onClick={() => setEditingUser(null)} className="flex-1 py-3 text-slate-500 font-bold">Cancel</button>
                                <button onClick={() => handleCreditUpdate(editingUser.credits)} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
