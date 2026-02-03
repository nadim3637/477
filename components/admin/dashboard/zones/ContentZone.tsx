import React, { useState, useEffect } from 'react';
import { Book, Video, FileText, List, Layers, Plus, Save, Trash2, Search, ArrowRight, CheckCircle } from 'lucide-react';
import { getSubjectsList, DEFAULT_SUBJECTS } from '../../../../constants';
import { fetchChapters } from '../../../../services/contentGenerator';
import { saveChapterData } from '../../../../firebase';
import { Subject, Chapter, Board, ClassLevel, Stream } from '../../../types';
import { storage } from '../../../../utils/storage';

export const ContentZone = (props: any) => {
    const [activeTab, setActiveTab] = useState('SUBJECTS');
    const [selBoard, setSelBoard] = useState<Board>('CBSE');
    const [selClass, setSelClass] = useState<ClassLevel>('10');
    const [selStream, setSelStream] = useState<Stream>('Science');
    const [selSubject, setSelSubject] = useState<Subject | null>(null);

    return (
        <div className="space-y-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
                {['SUBJECTS', 'CHAPTERS', 'PDF_NOTES', 'VIDEO_LECTURES', 'MCQ_BANK'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                            activeTab === tab 
                            ? 'bg-indigo-600 text-white shadow-lg' 
                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {tab.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Common Context Selector */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
                <select 
                    value={selBoard} 
                    onChange={e => setSelBoard(e.target.value as Board)}
                    className="p-2 border rounded-lg text-xs font-bold bg-slate-50"
                >
                    <option value="CBSE">CBSE</option>
                    <option value="BSEB">BSEB</option>
                </select>
                <select 
                    value={selClass} 
                    onChange={e => setSelClass(e.target.value as ClassLevel)}
                    className="p-2 border rounded-lg text-xs font-bold bg-slate-50"
                >
                    {['6','7','8','9','10','11','12'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {['11','12'].includes(selClass) && (
                    <select 
                        value={selStream} 
                        onChange={e => setSelStream(e.target.value as Stream)}
                        className="p-2 border rounded-lg text-xs font-bold bg-slate-50"
                    >
                        {['Science','Commerce','Arts'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                )}
            </div>

            {activeTab === 'SUBJECTS' && <SubjectsManager selClass={selClass} selStream={selStream} />}
            {activeTab === 'CHAPTERS' && <ChaptersManager board={selBoard} classLevel={selClass} stream={selStream} />}
            {(activeTab === 'PDF_NOTES' || activeTab === 'VIDEO_LECTURES') && (
                <ContentManager 
                    type={activeTab === 'PDF_NOTES' ? 'PDF' : 'VIDEO'} 
                    board={selBoard} 
                    classLevel={selClass} 
                    stream={selStream} 
                />
            )}
             {activeTab === 'MCQ_BANK' && <div className="p-8 text-center text-slate-400 font-bold bg-white rounded-3xl border border-dashed">Coming Soon: AI Powered MCQ Bank</div>}

        </div>
    );
};

const SubjectsManager = ({ selClass, selStream }: { selClass: ClassLevel, selStream: Stream }) => {
    const subjects = getSubjectsList(selClass, selStream);
    
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {subjects.map(s => (
                <div key={s.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${s.color.includes('text') ? 'bg-slate-200' : s.color}`}>
                        {s.name[0]}
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 text-sm">{s.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase">{s.id}</p>
                    </div>
                </div>
            ))}
            <button className="p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
                <Plus size={20} /> Add Subject
            </button>
        </div>
    );
};

const ChaptersManager = ({ board, classLevel, stream }: { board: Board, classLevel: ClassLevel, stream: Stream }) => {
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if(selectedSubject) {
            setLoading(true);
            fetchChapters(board, classLevel, stream, selectedSubject, 'English')
                .then(setChapters)
                .finally(() => setLoading(false));
        } else {
            setChapters([]);
        }
    }, [selectedSubject, board, classLevel, stream]);

    return (
        <div className="flex flex-col md:flex-row gap-6">
            {/* Subject List */}
            <div className="w-full md:w-1/3 space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Select Subject</h3>
                {getSubjectsList(classLevel, stream).map(s => (
                    <button
                        key={s.id}
                        onClick={() => setSelectedSubject(s)}
                        className={`w-full p-3 rounded-xl border text-left text-sm font-bold flex items-center justify-between ${
                            selectedSubject?.id === s.id 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {s.name}
                        {selectedSubject?.id === s.id && <ArrowRight size={16} />}
                    </button>
                ))}
            </div>

            {/* Chapter List */}
            <div className="flex-1 bg-white p-6 rounded-3xl border border-slate-200 min-h-[400px]">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                    <List size={20} /> Chapters {selectedSubject && `for ${selectedSubject.name}`}
                </h3>
                
                {loading && <div className="text-center py-10 text-slate-400 animate-pulse">Loading Chapters...</div>}
                
                {!selectedSubject && !loading && (
                    <div className="text-center py-10 text-slate-400">Select a subject to view chapters</div>
                )}

                {selectedSubject && !loading && (
                    <div className="space-y-3">
                        {chapters.map((ch, idx) => (
                            <div key={ch.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-sm transition-all">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                    <span className="font-bold text-slate-700">{ch.title}</span>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 text-slate-400 hover:text-blue-600"><Search size={16} /></button>
                                    <button className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                        <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold hover:text-indigo-600 hover:border-indigo-200 transition-colors flex items-center justify-center gap-2">
                            <Plus size={16} /> Add New Chapter
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ContentManager = ({ type, board, classLevel, stream }: { type: 'PDF' | 'VIDEO', board: Board, classLevel: ClassLevel, stream: Stream }) => {
    // Placeholder for content editing logic
    return (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                {type === 'PDF' ? <FileText size={32} /> : <Video size={32} />}
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Manage {type === 'PDF' ? 'PDF Notes' : 'Video Lectures'}</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-6">
                Select a subject and chapter in the Chapters tab to edit content.
                (Full content editor would go here)
            </p>
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">
                Open Content Editor
            </button>
        </div>
    );
};
