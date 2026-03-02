import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useGlobalState } from '../../context/GlobalStateContext';
import { api } from '../../../services/api';

const PendingReview: React.FC = () => {
  const { profile, setProfile, setUserRole } = useGlobalState();

  useEffect(() => {
    if (profile?.merchant_status === 'APPROVED') {
      // Already approved, redirect immediately
      setUserRole('merchant');
      return;
    }

    const interval = setInterval(async () => {
      try {
        const updatedProfile = await api.getProfile(profile!.id);
        if (updatedProfile) {
          setProfile(updatedProfile);
          if (updatedProfile.merchant_status === 'APPROVED') {
            setUserRole('merchant');
            clearInterval(interval);
          }
          if (updatedProfile.merchant_status === 'REJECTED') {
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Failed to poll for status:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [setProfile, setUserRole]);

  const renderStatus = () => {
    switch (profile?.merchant_status) {
      case 'PENDING':
        return (
          <div className="text-center space-y-4">
            <Clock size={48} className="mx-auto text-amber-500 animate-pulse" />
            <h2 className="text-2xl font-bold text-white">Application Under Review</h2>
            <p className="text-slate-400 max-w-sm mx-auto">
              Your application has been submitted and is currently being reviewed by the oversight committee. This may take up to 24 hours.
            </p>
            <p className="text-slate-500 text-sm">This screen will update automatically once a decision is made.</p>
          </div>
        );
      case 'REJECTED':
        return (
          <div className="text-center space-y-4">
            <AlertCircle size={48} className="mx-auto text-red-500" />
            <h2 className="text-2xl font-bold text-white">Application Rejected</h2>
            <p className="text-slate-400 max-w-sm mx-auto">
              We regret to inform you that your merchant application has been rejected. Please check your registered email for more details.
            </p>
          </div>
        );
      default:
        return null; // Should be redirected if approved
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6"
    >
      {renderStatus()}
    </motion.div>
  );
};

export default PendingReview;
