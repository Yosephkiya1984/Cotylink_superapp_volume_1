import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Users, ShieldCheck, Calendar as CalendarIcon, 
  MapPin, Clock, AlertTriangle, CheckCircle2, X, 
  FileText, Briefcase, GraduationCap, ChevronRight,
  Eye, EyeOff, Lock, Star, Filter, LogOut
} from 'lucide-react';
import { useGlobalState } from '../../context/GlobalStateContext';
import { ConsentEngine } from '../../../services/ConsentEngine';
import { JobEngine, JobProfile, JobConsentRequest, Interview } from '../../../services/JobEngine';

// Mock Data for Talent Radar
const MOCK_TALENT = [
  { id: 'cit_1', name: 'Abebe Kebede', verified: true, education: 'BSc Computer Science', experience: 4, skills: ['React', 'Node.js', 'PostgreSQL'], trustScore: 95, status: 'NONE' },
  { id: 'cit_2', name: 'Sara Tadesse', verified: true, education: 'MSc Data Science', experience: 2, skills: ['Python', 'Machine Learning', 'SQL'], trustScore: 88, status: 'PENDING' },
  { id: 'cit_3', name: 'Dawit Mekonnen', verified: true, education: 'BA Business Admin', experience: 6, skills: ['Project Management', 'Agile', 'Scrum'], trustScore: 92, status: 'GRANTED' },
  { id: 'cit_4', name: 'Meron Hailu', verified: false, education: 'Diploma IT', experience: 1, skills: ['HTML', 'CSS', 'JavaScript'], trustScore: 60, status: 'NONE' },
];

const MOCK_INTERVIEWS = [
  { id: 'int_1', candidate: 'Dawit Mekonnen', role: 'Project Manager', date: '2026-03-05', time: '10:00 AM', location: 'Bole Atlas, CityLink HQ' }
];

const EmployerDashboard: React.FC = () => {
  const { profile, setProfile, setView } = useGlobalState();
  const [activeTab, setActiveTab] = useState<'radar' | 'permissions' | 'interviews'>('radar');
  const [searchQuery, setSearchQuery] = useState('');
  const [talent, setTalent] = useState<JobProfile[]>([]);
  const [requests, setRequests] = useState<JobConsentRequest[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [merchantRating, setMerchantRating] = useState(98); // Mock rating

  // Secure Viewer State
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportField, setReportField] = useState('Education');
  const [reportNotes, setReportNotes] = useState('');

  // Interview Scheduler State
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    
    const loadData = async () => {
      const t = await JobEngine.getTalentPool();
      setTalent(t);
      const r = await JobEngine.getMerchantRequests(profile.id);
      setRequests(r);
      const i = await JobEngine.getMerchantInterviews(profile.id);
      setInterviews(i);
    };

    loadData();
    const unsubscribe = JobEngine.subscribe(loadData);
    return () => { unsubscribe(); };
  }, [profile?.id]);

  const handleRequestAccess = async (citizenId: string) => {
    if (!profile?.id) return;
    try {
      await JobEngine.requestAccess(profile.id, profile.merchant_name || 'Employer', citizenId, 'ALL_DOCS');
    } catch (error) {
      console.error(error);
    }
  };

  const handleViewDocument = (candidateId: string) => {
    const req = requests.find(r => r.citizenId === candidateId && r.status === 'GRANTED');
    if (!req) return;
    const candidate = talent.find(t => t.citizenId === candidateId);
    setViewingDoc(candidate);
  };

  const handleReportDiscrepancy = async () => {
    if (!profile?.id || !viewingDoc) return;
    try {
      await ConsentEngine.reportDiscrepancy(profile.id, viewingDoc.id, reportField);
      alert(`Warning sent to ${viewingDoc.name}: "Your form states one thing, but your certificate shows another. Please update your profile."`);
      setReportModalOpen(false);
      setViewingDoc(null);
      // Penalize merchant slightly for reporting to prevent abuse (mock logic)
      setMerchantRating(prev => Math.max(0, prev - 2));
    } catch (error) {
      console.error(error);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !selectedCandidate) return;
    
    const formData = new FormData(e.target as HTMLFormElement);
    await JobEngine.scheduleInterview({
      merchantId: profile.id,
      citizenId: selectedCandidate.citizenId,
      merchantName: profile.merchant_name || 'Employer',
      candidateName: selectedCandidate.name,
      role: formData.get('role') as string,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      location: formData.get('location') as string,
    });
    
    setScheduleModalOpen(false);
    setSelectedCandidate(null);
  };

  const handleLogout = () => {
    setProfile(null);
    setView('home');
  };

  const filteredTalent = talent.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const grantedRequests = requests.filter(r => r.status === 'GRANTED');

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans selection:bg-indigo-500/30 pb-20">
      {/* Header / Navy Theme */}
      <div className="bg-[#1A237E] pt-8 pb-6 px-6 shadow-2xl border-b border-indigo-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-400/30 shrink-0">
                <Briefcase className="w-6 h-6 text-indigo-300" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{profile?.merchant_name || 'Employer Portal'}</h1>
                <p className="text-indigo-200 text-xs sm:text-sm font-medium">Recruitment & Talent Acquisition</p>
              </div>
            </div>
          </div>
          
          {/* Merchant Rating and Logout */}
          <div className="flex items-center gap-4 self-end sm:self-auto">
            <div className="bg-indigo-950/50 border border-indigo-800/50 rounded-2xl p-2 sm:p-3 flex items-center gap-3 backdrop-blur-md">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 hidden sm:block">Employer Rating</p>
                <p className="text-lg sm:text-xl font-black text-white">{merchantRating}<span className="text-xs sm:text-sm text-indigo-400">/100</span></p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 fill-emerald-400" />
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-indigo-950/50 hover:bg-red-500/20 border border-indigo-800/50 hover:border-red-500/50 rounded-2xl p-2 sm:p-3 flex items-center justify-center backdrop-blur-md transition-all group shrink-0"
              title="Log Out"
            >
              <LogOut className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-300 group-hover:text-red-400 transition-colors" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mt-6 sm:mt-8 bg-indigo-950/40 p-1.5 rounded-2xl border border-indigo-800/50 backdrop-blur-sm overflow-x-auto no-scrollbar w-full sm:w-fit">
          {[
            { id: 'radar', label: 'Talent Radar', icon: Search },
            { id: 'permissions', label: 'Permissions', icon: ShieldCheck },
            { id: 'interviews', label: 'War-Room', icon: CalendarIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'text-indigo-300 hover:text-white hover:bg-indigo-800/50'
              }`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* TALENT RADAR */}
        {activeTab === 'radar' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input 
                  type="text"
                  placeholder="Search by skills, education, or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
              <button className="bg-slate-900 border border-slate-800 rounded-2xl px-6 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-all">
                <Filter className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-950/50 border-b border-slate-800">
                    <th className="p-5 text-xs font-bold uppercase tracking-widest text-slate-500">Candidate</th>
                    <th className="p-5 text-xs font-bold uppercase tracking-widest text-slate-500">Education & Exp</th>
                    <th className="p-5 text-xs font-bold uppercase tracking-widest text-slate-500">Top Skills</th>
                    <th className="p-5 text-xs font-bold uppercase tracking-widest text-slate-500 text-center">Trust</th>
                    <th className="p-5 text-xs font-bold uppercase tracking-widest text-slate-500 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredTalent.map(candidate => (
                    <tr key={candidate.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
                            {candidate.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{candidate.name}</span>
                              {candidate.verified && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            </div>
                            <span className="text-xs text-slate-500">ID: {candidate.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-slate-300 flex items-center gap-2"><GraduationCap className="w-3.5 h-3.5 text-slate-500"/> {candidate.education}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-2"><Briefcase className="w-3.5 h-3.5"/> {candidate.experience} Years Exp.</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-wrap gap-2">
                          {candidate.skills.slice(0, 3).map(skill => (
                            <span key={skill} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider border border-slate-700">
                              {skill}
                            </span>
                          ))}
                          {candidate.skills.length > 3 && <span className="text-xs text-slate-500">+{candidate.skills.length - 3}</span>}
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black">
                          {candidate.trustScore}
                        </div>
                      </td>
                      <td className="p-5 text-right">
                        {(() => {
                          const req = requests.find(r => r.citizenId === candidate.citizenId);
                          const status = req ? req.status : 'NONE';
                          
                          if (status === 'NONE' || status === 'DENIED') {
                            return (
                              <button 
                                onClick={() => handleRequestAccess(candidate.citizenId)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-900/20"
                              >
                                Request Access
                              </button>
                            );
                          } else if (status === 'PENDING') {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 text-sm font-bold border border-amber-500/20">
                                <Clock className="w-4 h-4" /> Pending
                              </span>
                            );
                          } else {
                            return (
                              <button 
                                onClick={() => handleViewDocument(candidate.citizenId)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2 ml-auto"
                              >
                                <Eye className="w-4 h-4" /> View Docs
                              </button>
                            );
                          }
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* PERMISSION MANAGER */}
        {activeTab === 'permissions' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pending */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Pending Requests ({pendingRequests.length})
              </h3>
              <div className="space-y-3">
                {pendingRequests.map(req => {
                  const candidate = talent.find(t => t.citizenId === req.citizenId);
                  return (
                  <div key={req.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold">
                        {candidate?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-white">{candidate?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">Requested recently</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">Awaiting Citizen</span>
                  </div>
                )})}
                {pendingRequests.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No pending requests.</p>}
              </div>
            </div>

            {/* Granted */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500 mb-6 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Granted Access ({grantedRequests.length})
              </h3>
              <div className="space-y-3">
                {grantedRequests.map(req => {
                  const candidate = talent.find(t => t.citizenId === req.citizenId);
                  return (
                  <div key={req.id} className="bg-slate-950 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500" />
                    <div className="flex items-center gap-3 pl-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/20">
                        {candidate?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-white">{candidate?.name || 'Unknown'}</p>
                        <p className="text-xs text-emerald-500/70">Access expires in 24h</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setSelectedCandidate(candidate); setScheduleModalOpen(true); }}
                        className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition-colors border border-indigo-500/20"
                        title="Schedule Interview"
                      >
                        <CalendarIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleViewDocument(req.citizenId)}
                        className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl transition-colors border border-emerald-500/20"
                        title="View Documents"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )})}
                {grantedRequests.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No granted requests.</p>}
              </div>
            </div>
          </motion.div>
        )}

        {/* INTERVIEW WAR-ROOM */}
        {activeTab === 'interviews' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Upcoming Interviews</h2>
              <button 
                onClick={() => setScheduleModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-900/20 flex items-center gap-2"
              >
                <CalendarIcon className="w-4 h-4" /> Schedule New
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {interviews.map(interview => (
                <div key={interview.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/10 transition-colors" />
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <h3 className="font-bold text-lg text-white">{interview.candidateName}</h3>
                      <p className="text-indigo-400 text-sm font-medium">{interview.role}</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800">
                      <Briefcase className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-3 relative z-10">
                    <div className="flex items-center gap-3 text-sm text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                      <CalendarIcon className="w-4 h-4 text-indigo-400" />
                      {new Date(interview.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {interview.time}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      <span className="truncate">{interview.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* SECURE VIEWER MODAL (No-Screenshot Logic) */}
      <AnimatePresence>
        {viewingDoc && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
            onContextMenu={(e) => e.preventDefault()} // Disable right click
          >
            {/* Dynamic Watermark Overlay to deter screenshots */}
            <div className="absolute inset-0 pointer-events-none opacity-10 flex flex-wrap justify-center items-center overflow-hidden z-50">
              {Array.from({ length: 50 }).map((_, i) => (
                <span key={i} className="text-white text-2xl font-black transform -rotate-45 m-8 select-none">
                  {profile?.merchant_name} • {new Date().toISOString().split('T')[0]}
                </span>
              ))}
            </div>

            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative z-40 overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-950/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                    <Lock className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Secure Document Viewer</h3>
                    <p className="text-xs text-emerald-500 font-mono">End-to-End Encrypted • No Screenshots Allowed</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setReportModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-bold border border-red-500/20 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" /> Report Discrepancy
                  </button>
                  <button onClick={() => setViewingDoc(null)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-slate-900 select-none">
                {/* Mock Document Content */}
                <div className="max-w-2xl mx-auto bg-white rounded-lg p-12 shadow-2xl text-slate-900 min-h-[600px] relative">
                  <div className="text-center border-b-2 border-slate-200 pb-8 mb-8">
                    <h1 className="text-3xl font-serif font-bold text-slate-900 uppercase tracking-widest">Official Transcript</h1>
                    <p className="text-slate-500 mt-2">Addis Ababa University</p>
                  </div>
                  
                  <div className="space-y-6 font-serif">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-500 uppercase text-xs tracking-widest">Student Name</span>
                      <span className="font-bold text-lg">{viewingDoc.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-500 uppercase text-xs tracking-widest">Degree Awarded</span>
                      <span className="font-bold text-lg">{viewingDoc.education}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-500 uppercase text-xs tracking-widest">Date of Issue</span>
                      <span className="font-bold text-lg">July 15, 2022</span>
                    </div>
                  </div>

                  <div className="absolute bottom-12 left-12 right-12 border-t-2 border-slate-200 pt-8 flex justify-between items-end">
                    <div>
                      <div className="w-32 h-1 bg-slate-300 mb-2"></div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Registrar Signature</p>
                    </div>
                    <div className="w-24 h-24 border-4 border-red-800/20 rounded-full flex items-center justify-center transform -rotate-12">
                      <span className="text-red-800/40 font-bold uppercase tracking-widest text-xs text-center">Official<br/>Seal</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REPORT DISCREPANCY MODAL */}
      <AnimatePresence>
        {reportModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-red-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/30">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Report Mismatch</h3>
                  <p className="text-sm text-slate-400">Flag incorrect profile data</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Mismatched Field</label>
                  <select 
                    value={reportField}
                    onChange={(e) => setReportField(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  >
                    <option value="Education">Education Level</option>
                    <option value="Experience">Years of Experience</option>
                    <option value="Skills">Claimed Skills</option>
                    <option value="Identity">Identity / Name</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Details (Optional)</label>
                  <textarea 
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    placeholder="e.g., Form says Masters, but certificate is a Diploma."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white h-24 resize-none focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                </div>
                
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                  <p className="text-xs text-red-400 font-medium leading-relaxed">
                    <strong className="font-black">Warning:</strong> Submitting this report will send an automated warning to the candidate. False reporting will negatively impact your Employer Trust Score.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setReportModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleReportDiscrepancy}
                  className="flex-1 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white transition-colors shadow-lg shadow-red-900/20"
                >
                  Submit Report
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SCHEDULE INTERVIEW MODAL */}
      <AnimatePresence>
        {scheduleModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Schedule Interview</h3>
                <button onClick={() => setScheduleModalOpen(false)} className="text-slate-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleScheduleInterview} className="space-y-4">
                {selectedCandidate && (
                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl mb-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">Candidate</p>
                    <p className="font-bold text-white">{selectedCandidate.name}</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Role / Position</label>
                  <input required name="role" type="text" placeholder="e.g. Senior Developer" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Date</label>
                    <input required name="date" type="date" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Time</label>
                    <input required name="time" type="time" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Location (CityLink Maps)</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <input required name="location" type="text" placeholder="Search location..." className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>

                <button type="submit" className="w-full py-4 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-900/20 mt-4">
                  Send Invite
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployerDashboard;
