import React, { useState, KeyboardEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Briefcase, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  AlertTriangle,
  GraduationCap,
  Star,
  Lock,
  Sparkles,
  Award,
  BookOpen,
  TrendingUp,
  X
} from 'lucide-react';
import { useGlobalState } from '../../context/GlobalStateContext';
import { JobEngine, JobProfile, JobConsentRequest } from '../../../services/JobEngine';

// --- i18n Mock (Localization for English / Amharic) ---
const translations = {
  en: {
    dashboard: "Career Hub",
    trustScore: "Trust Score",
    verified: "Fayda Verified",
    reputation: "Excellent Standing",
    needsAttention: "Needs Attention",
    fixScore: "Re-verify your BA Degree to boost your score.",
    recentPings: "Access Requests",
    noRequests: "Your vault is secure. No pending requests.",
    grantView: "Grant Access",
    decline: "Decline",
    securityNote: "10-min secure view. Screen recording disabled.",
    updateProfile: "Enhance Profile",
    updateDesc: "Add skills & experience to unlock better opportunities.",
    step1: "Education Level",
    step2: "Years of Experience",
    step3: "Top Skills",
    next: "Continue",
    submit: "Complete Profile",
    back: "Back",
    required: "Required",
    activeApps: "Active Apps",
    vault: "Secure Vault",
    addSkill: "Type a skill and press Enter...",
  },
  am: {
    dashboard: "የስራ ማዕከል",
    trustScore: "የእምነት ነጥብ",
    verified: "በፋይዳ የተረጋገጠ",
    reputation: "ጥሩ ስም",
    needsAttention: "ትኩረት ይፈልጋል",
    fixScore: "ነጥብዎን ለማሳደግ የዲግሪዎን መረጃ እንደገና ያረጋግጡ።",
    recentPings: "የመዳረሻ ጥያቄዎች",
    noRequests: "ምንም በመጠባበቅ ላይ ያሉ ጥያቄዎች የሉም።",
    grantView: "እይታ ፍቀድ",
    decline: "አይቀበሉም",
    securityNote: "ለ10 ደቂቃ እይታ። ስክሪን መቅረጽ ተሰናክሏል።",
    updateProfile: "መገለጫ ያሳድጉ",
    updateDesc: "የተሻሉ እድሎችን ለማግኘት ክህሎቶችን ያክሉ።",
    step1: "የትምህርት ደረጃ",
    step2: "የልምድ ዓመታት",
    step3: "ዋና ክህሎቶች",
    next: "ቀጥል",
    submit: "መገለጫ ጨርስ",
    back: "ተመለስ",
    required: "ግዴታ",
    activeApps: "ማመልከቻዎች",
    vault: "ዲጂታል ካዝና",
    addSkill: "ክህሎት ይጻፉ እና Enter ይጫኑ...",
  }
};

type Language = 'en' | 'am';

// --- Mock Data ---
const MOCK_REQUESTS = [
  { id: '1', merchantName: 'EthioTech Solutions', businessType: 'Technology', docType: 'BSc Computer Science', time: '2m ago' },
  { id: '2', merchantName: 'Addis Bank', businessType: 'Finance', docType: 'Fayda ID', time: '1h ago' }
];

// --- Components ---

const CircularProgress = ({ score }: { score: number }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const isHigh = score > 80;
  const color = isHigh ? 'text-emerald-400' : score > 50 ? 'text-amber-400' : 'text-red-400';
  const glow = isHigh ? 'drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : '';

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          className="text-white/10"
          strokeWidth="6"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={`${color} ${glow}`}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-white">
        <span className="text-3xl font-black tracking-tighter">{score}</span>
      </div>
    </div>
  );
};

export const CitizenJobDashboard: React.FC = () => {
  const { profile } = useGlobalState();
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  const [jobProfile, setJobProfile] = useState<JobProfile | null>(null);
  const [requests, setRequests] = useState<JobConsentRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    education: '',
    experience: 0,
    skills: [] as string[]
  });
  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!profile?.id) return;
    
    const loadData = async () => {
      const p = await JobEngine.getProfile(profile.id);
      setJobProfile(p);
      if (p) {
        setFormData({
          education: p.education,
          experience: p.experience,
          skills: p.skills
        });
      }
      const reqs = await JobEngine.getCitizenRequests(profile.id);
      setRequests(reqs.filter((r: any) => r.status === 'PENDING'));
    };

    loadData();
    const unsubscribe = JobEngine.subscribe(loadData);
    return () => { unsubscribe(); };
  }, [profile?.id]);

  const handleGrant = async (id: string) => {
    await JobEngine.updateRequestStatus(id, 'GRANTED');
  };
  const handleDecline = async (id: string) => {
    await JobEngine.updateRequestStatus(id, 'DENIED');
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (formStep === 1 && !formData.education) newErrors.education = t.required;
    if (formStep === 3 && formData.skills.length === 0) newErrors.skills = t.required;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => { if (validateStep()) setFormStep(s => Math.min(3, s + 1)); };
  const prevStep = () => setFormStep(s => Math.max(1, s - 1));

  const submitForm = async () => {
    if (validateStep() && profile?.id) {
      await JobEngine.updateProfile(profile.id, profile.name || 'Citizen', formData);
      setShowForm(false);
      setFormStep(1);
    }
  };

  const handleAddSkill = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!formData.skills.includes(skillInput.trim())) {
        setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skillToRemove) });
  };

  const eduOptions = [
    { id: 'highschool', label: 'High School', icon: <BookOpen className="w-6 h-6" /> },
    { id: 'bachelor', label: "Bachelor's Degree", icon: <GraduationCap className="w-6 h-6" /> },
    { id: 'master', label: "Master's Degree", icon: <Award className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen bg-[#020617] pb-24 font-sans selection:bg-blue-500/30">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-[#0047AB] to-[#020617] pt-8 pb-12 px-6 rounded-b-[40px] shadow-2xl overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-blue-400/10 blur-3xl" />
          <div className="absolute bottom-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-400/10 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-black text-white tracking-tight">{t.dashboard}</h1>
            <button 
              onClick={() => setLang(lang === 'en' ? 'am' : 'en')}
              className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold text-white backdrop-blur-md border border-white/10 transition-colors"
            >
              {lang === 'en' ? 'አማርኛ' : 'English'}
            </button>
          </div>
          
          <div className="flex items-center gap-6 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
            <CircularProgress score={jobProfile?.trustScore || 0} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-emerald-400 text-sm tracking-wide uppercase">{jobProfile?.verified ? t.verified : 'Unverified'}</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">{t.trustScore}</h2>
              {(jobProfile?.trustScore || 0) > 80 ? (
                <p className="text-sm text-blue-200 flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-4 h-4 text-amber-300" /> {t.reputation}
                </p>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm text-amber-400 flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-4 h-4" /> {t.needsAttention}
                  </p>
                  <p className="text-xs text-blue-200">{t.fixScore}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-6 space-y-6 relative z-20">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div whileHover={{ scale: 1.02 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-4 border border-blue-500/30">
              <Briefcase className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">3</p>
              <p className="text-sm text-slate-400 font-medium">{t.activeApps}</p>
            </div>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-4 border border-indigo-500/30">
              <FileText className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-white">5</p>
              <p className="text-sm text-slate-400 font-medium">{t.vault}</p>
            </div>
          </motion.div>
        </div>

        {/* Premium Update Profile CTA */}
        <motion.button 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-1 shadow-xl shadow-blue-900/20 group"
        >
          <div className="bg-slate-900/40 backdrop-blur-sm rounded-[22px] p-5 flex items-center justify-between border border-white/10 group-hover:bg-transparent transition-colors duration-300">
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shadow-inner">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="block font-bold text-lg text-white mb-0.5">{t.updateProfile}</span>
                <span className="block text-xs text-blue-200 font-medium">{t.updateDesc}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </div>
        </motion.button>

        {/* Pending Requests (Privacy Handshake) */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xl font-bold text-white">{t.recentPings}</h3>
            {requests.length > 0 && (
              <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2.5 py-1 rounded-full border border-red-500/20">
                {requests.length} New
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            <AnimatePresence>
              {requests.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 text-center"
                >
                  <Lock className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">{t.noRequests}</p>
                </motion.div>
              ) : (
                requests.map((req) => (
                  <motion.div 
                    key={req.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50, scale: 0.95 }}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden"
                  >
                    {/* Security Pattern Background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />
                    
                    <div className="flex justify-between items-start mb-5 relative z-10">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-lg text-white">{req.merchantName}</h4>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                            {new Date(req.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <p className="text-sm text-blue-400 font-medium">{req.docType}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shadow-inner">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mb-4 relative z-10">
                      <button 
                        onClick={() => handleGrant(req.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
                      >
                        <CheckCircle2 className="w-5 h-5" /> {t.grantView}
                      </button>
                      <button 
                        onClick={() => handleDecline(req.id)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-slate-700"
                      >
                        <XCircle className="w-5 h-5" /> {t.decline}
                      </button>
                    </div>
                    
                    <div className="bg-slate-950/50 rounded-xl p-3 flex items-start gap-2 border border-slate-800/50">
                      <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        {t.securityNote}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* World-Class Form Modal (Bottom Sheet Style) */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end justify-center sm:items-center sm:p-4"
          >
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-slate-900 w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl border border-slate-800 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white">{t.updateProfile}</h2>
                  <p className="text-sm text-slate-400 font-medium mt-1">Step {formStep} of 3</p>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Sleek Progress Bar */}
              <div className="flex gap-2 mb-10">
                {[1, 2, 3].map(step => (
                  <div key={step} className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: step <= formStep ? '100%' : '0%' }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                ))}
              </div>

              {/* Form Steps */}
              <div className="min-h-[280px]">
                {/* Step 1: Selectable Cards */}
                {formStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <label className="block text-lg font-bold text-white mb-4">{t.step1}</label>
                    <div className="space-y-3">
                      {eduOptions.map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setFormData({...formData, education: opt.id})}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                            formData.education === opt.id 
                              ? 'border-blue-500 bg-blue-500/10 text-white' 
                              : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          <div className={`p-3 rounded-xl ${formData.education === opt.id ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                            {opt.icon}
                          </div>
                          <span className="font-bold text-lg">{opt.label}</span>
                          {formData.education === opt.id && <CheckCircle2 className="w-6 h-6 ml-auto text-blue-500" />}
                        </button>
                      ))}
                    </div>
                    {errors.education && <p className="text-red-400 text-sm mt-3 font-medium flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> {errors.education}</p>}
                  </motion.div>
                )}

                {/* Step 2: Custom Thick Slider */}
                {formStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <label className="block text-lg font-bold text-white mb-8">{t.step2}</label>
                    <div className="text-center mb-8">
                      <span className="text-6xl font-black text-blue-400">{formData.experience}</span>
                      <span className="text-xl text-slate-500 font-bold ml-2">years</span>
                    </div>
                    <input 
                      type="range" min="0" max="20" 
                      className="w-full h-4 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      value={formData.experience}
                      onChange={e => setFormData({...formData, experience: parseInt(e.target.value)})}
                    />
                    <div className="flex justify-between text-sm font-bold text-slate-500 mt-4">
                      <span>Entry Level</span>
                      <span>Veteran (20+)</span>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Tag Input */}
                {formStep === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <label className="block text-lg font-bold text-white mb-4">{t.step3}</label>
                    
                    <div className="bg-slate-800/50 border-2 border-slate-700 rounded-2xl p-4 focus-within:border-blue-500 transition-colors">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <AnimatePresence>
                          {formData.skills.map(skill => (
                            <motion.span 
                              key={skill}
                              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                              className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-2"
                            >
                              {skill}
                              <button onClick={() => removeSkill(skill)} className="hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                            </motion.span>
                          ))}
                        </AnimatePresence>
                      </div>
                      <input 
                        type="text"
                        className="w-full bg-transparent text-white placeholder-slate-500 font-medium outline-none mt-2"
                        placeholder={t.addSkill}
                        value={skillInput}
                        onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={handleAddSkill}
                      />
                    </div>
                    {errors.skills && <p className="text-red-400 text-sm mt-3 font-medium flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> {errors.skills}</p>}
                  </motion.div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 mt-10">
                {formStep > 1 && (
                  <button 
                    onClick={prevStep}
                    className="flex-1 py-4 rounded-2xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    {t.back}
                  </button>
                )}
                <button 
                  onClick={formStep === 3 ? submitForm : nextStep}
                  className="flex-[2] py-4 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
                >
                  {formStep === 3 ? t.submit : t.next}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CitizenJobDashboard;
