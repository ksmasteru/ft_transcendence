import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../components/shared/Header';
import { Sidebar } from '../components/shared/Sidebar';
import { useUserData } from '../hooks/useUserData';

import { 
  LayoutDashboard, 
  Shield, 
  User, 
  Lock, 
  SlidersHorizontal, 
  X, 
  Eye, 
  EyeOff, 
  Copy, 
  Download 
} from 'lucide-react';


const Logo = () => (
  <div className="p-5 text-center">
    <div className="w-10 h-10 bg-gray-800 rounded-full mx-auto flex items-center justify-center font-bold text-teal-400">
      PP
    </div>
  </div>
);


const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-[#2e2e2e] p-6 rounded-xl shadow-lg w-full max-w-md border border-[#3f3f3f] relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// --- Settings Page Specific Components ---
const SettingsSidebar = ({ activeTab, setActiveTab }) => {
  const settingsNav = [
    { id: 'profile', icon: <User size={20} />, label: 'User profile' },
    { id: '2fa', icon: <Lock size={20} />, label: '2FA' },
    { id: 'preferences', icon: <SlidersHorizontal size={20} />, label: 'Preferences' },
  ];

  return (
    <aside className="w-full md:w-64 bg-[#2c3138]/30 p-6 rounded-lg flex-shrink-0">
      <div className="space-y-2">
        {settingsNav.map(item => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id)} 
            className={`w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors ${
              activeTab === item.id 
                ? 'bg-teal-500/20 text-teal-300' 
                : 'text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            {item.icon}
            <span className="font-semibold">{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
};

const UserProfileContent = ({ userData: initialUserData, onUpdate }) => {
  const [formData, setFormData] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    password: '' 
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialUserData) {
      const [firstName, ...lastNameParts] = initialUserData.name ? initialUserData.name.split(' ') : ['', ''];
      setFormData({ 
        firstName: firstName || '', 
        lastName: lastNameParts.join(' ') || '', 
        email: initialUserData.email || '', 
        password: '' 
      });
      setAvatarPreview(initialUserData.avatar || 'https://i.pravatar.cc/150');
    }
  }, [initialUserData]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };
  
  const handleSaveChanges = async () => {
    setIsLoading(true);
    const payload: any = { 
      name: `${formData.firstName} ${formData.lastName}`.trim(), 
      email: formData.email 
    };
    if (formData.password) payload.password = formData.password;

    try {
      const response = await fetch(`http://localhost:3000/api/v1/user/${initialUserData.id}`, {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        credentials: 'include', 
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update profile.');
      
      alert('Profile updated successfully!');
      onUpdate(prev => ({...prev, ...result.data}));
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[#2c3138]/30 p-8 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">User Profile</h2>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex flex-col items-center lg:items-start flex-shrink-0">
          <img 
            src={avatarPreview} 
            alt="User Avatar" 
            className="w-32 h-32 rounded-full mb-4 object-cover"
          />
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
            className="hidden"
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()} 
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg text-sm"
          >
            Change Photo
          </button>
        </div>
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">First Name</label>
              <input 
                required 
                type="text" 
                name="firstName" 
                value={formData.firstName} 
                onChange={handleChange} 
                className="w-full bg-[#1e2124] p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Last Name</label>
              <input 
                required 
                type="text" 
                name="lastName" 
                value={formData.lastName} 
                onChange={handleChange} 
                className="w-full bg-[#1e2124] p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input 
              required 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              className="w-full bg-[#1e2124] p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                placeholder="Enter new password to change" 
                className="w-full bg-[#1e2124] p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleSaveChanges}
              disabled={isLoading} 
              className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthenticatorSetupModal = ({ isOpen, onClose, qrCodeDataUrl, userId, onVerificationSuccess }) => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`http://localhost:3000/api/v1/auth/verify-2fa`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        credentials: 'include',
        body: JSON.stringify({ userId, token })
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Verification failed.');
      
      onVerificationSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set up Authenticator App">
      <div className="space-y-4">
        <p className="text-gray-400">
          Scan this QR code with your authenticator app, then enter the 6-digit code below.
        </p>
        <div className="bg-white p-4 rounded-lg flex justify-center">
          {qrCodeDataUrl ? (
            <img src={qrCodeDataUrl} alt="2FA QR Code" />
          ) : (
            <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500">
              Generating QR Code...
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Verification Code
          </label>
          <input 
            type="text" 
            placeholder="Enter 6-digit code" 
            maxLength={6} 
            value={token} 
            onChange={(e) => setToken(e.target.value)} 
            className="w-full bg-[#1e2124] p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-center tracking-[0.5em] text-white"
          />
        </div>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button 
            onClick={onClose} 
            className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Cancel
          </button>
          <button 
            onClick={handleVerify} 
            disabled={isLoading || token.length < 6} 
            className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg disabled:bg-gray-500"
          >
            {isLoading ? 'Verifying...' : 'Verify & Enable'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const BackupCodesModal = ({ isOpen, onClose, backupCodes = [] }) => {
  const codesString = backupCodes.join('\n');
  
  const handleCopy = () => {
    navigator.clipboard.writeText(codesString).then(() => 
      alert('Codes copied to clipboard!')
    );
  };
  
  const handleDownload = () => {
    const blob = new Blob([codesString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save Your Backup Codes">
      <div className="space-y-4">
        <p className="text-yellow-300 bg-yellow-500/10 p-3 rounded-lg text-sm">
          <strong>Important:</strong> Store these codes in a safe place. They can be used to access your account if you lose your device.
        </p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 bg-[#1e2124] p-4 rounded-lg font-mono text-white tracking-wider">
          {backupCodes.map(code => (
            <span key={code}>{code}</span>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button 
            onClick={handleCopy} 
            className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <Copy size={16} /> Copy
          </button>
          <button 
            onClick={handleDownload} 
            className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <Download size={16} /> Download
          </button>
          <button 
            onClick={onClose} 
            className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};

const TwoFactorAuthContent = ({ userData, onUpdate }) => {
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [securityActivity, setSecurityActivity] = useState([]); 
  const [isLogsLoading, setIsLogsLoading] = useState(true);

  useEffect(() => {
    const fetchSecurityLogs = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/v1/log/logs`, {
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to fetch logs.');

        const logs = await response.json();
        
        const formattedEvents = logs.map(log => ({
          id: log.id,
          activity: log.message,
          date: new Date(log.createdAt).toLocaleString(),
          status: log.level,
          statusColor: log.level === 'error' ? 'text-red-400' : 'text-green-400', 
        }));

        setSecurityActivity(formattedEvents);
      } catch (error) {
        console.error("Error fetching security logs:", error);
        setSecurityActivity([]); 
      } finally {
        setIsLogsLoading(false);
      }
    };

    fetchSecurityLogs();
  }, []);

  const handleEnable2FA = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/v1/auth/enable-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: userData.id })
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to start 2FA setup.');
      
      // Log the event
      await fetch(`http://localhost:3000/api/v1/log/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          level: 'info',
          message: 'User successfully enabled two-factor authentication.',
          component: 'auth-service',
          userId: userData.id
        })
      });
      
      setQrCodeDataUrl(result.qrCode);
      setBackupCodes(result.backupCodes);
      setIsSetupModalOpen(true);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDisable2FA = async () => {
    const token = window.prompt("For your security, please enter a code from your authenticator app to disable 2FA.");
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/v1/auth/disable-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: userData.id, token })
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to disable 2FA.');
      
      alert('2FA disabled successfully.');

      // Log the event
      await fetch(`http://localhost:3000/api/v1/log/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          level: 'info',
          message: 'User successfully disabled two-factor authentication.',
          component: 'auth-service',
          userId: userData.id
        })
      });
      
      onUpdate({ ...userData, twoFactorEnabled: false });
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerificationSuccess = () => {
    onUpdate({ ...userData, twoFactorEnabled: true });
    setIsSetupModalOpen(false);
    setShowBackupCodesModal(true);
  };
  
  return (
    <>
      <div className="flex-1">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Lock size={24} /> Two Factor Authentication
        </h3>
        <div className="bg-blue-500/10 border border-blue-400/30 p-4 rounded-lg mb-6">
          <p className="text-blue-200">
            2FA adds an extra layer of security to your account by requiring a second form of verification.
          </p>
        </div>
        <div className="bg-[#2c3138]/50 p-6 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-white">Authenticator App</h4>
              <p className="text-sm text-gray-500">
                Current Status: <span className={userData.twoFactorEnabled ? 'text-green-400' : 'text-red-400'}>
                  {userData.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </p>
            </div>
            <button 
              onClick={userData.twoFactorEnabled ? handleDisable2FA : handleEnable2FA} 
              disabled={isLoading} 
              className={`font-semibold py-2 px-4 rounded-lg transition-colors ${
                userData.twoFactorEnabled 
                  ? 'bg-red-500/80 hover:bg-red-500 text-white' 
                  : 'bg-teal-500 hover:bg-teal-600 text-white'
              } disabled:bg-gray-500 disabled:cursor-not-allowed`}
            >
              {isLoading ? '...' : (userData.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA')}
            </button>
          </div>
        </div>
        <div className="bg-[#2c3138]/50 p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Recent Security Activity</h3>
          <div className="space-y-2">
            {isLogsLoading ? (
              <p className="text-gray-400">Loading security activity...</p>
            ) : securityActivity.length > 0 ? (
              securityActivity.map(item => (
                <div key={item.id} className="grid grid-cols-3 items-center bg-[#1e2124] p-4 rounded-md">
                  <span className="text-white">{item.activity}</span>
                  <span className="text-gray-400">{item.date}</span>
                  <span className={`text-right font-semibold ${item.statusColor}`}>
                    {item.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-400">No security activity found.</p>
            )}
          </div>
        </div>
      </div>
      <AuthenticatorSetupModal 
        isOpen={isSetupModalOpen} 
        onClose={() => setIsSetupModalOpen(false)} 
        qrCodeDataUrl={qrCodeDataUrl} 
        userId={userData.id} 
        onVerificationSuccess={handleVerificationSuccess}
      />
      <BackupCodesModal 
        isOpen={showBackupCodesModal} 
        onClose={() => setShowBackupCodesModal(false)} 
        backupCodes={backupCodes} 
      />
    </>
  );
};

const PreferencesContent = () => {
  return (
    <div className="flex-1 bg-[#2c3138]/30 p-8 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Preferences</h2>
      <p className="text-gray-400">Preference settings will be implemented here.</p>
    </div>
  );
};

// --- Main Component ---
export default function SecurityPage() {
  const { userData, loading, error } = useUserData();
  const [userState, setUserState] = useState(userData);
  const [activeTab, setActiveTab] = useState('profile');

  // Update local state when userData changes
  useEffect(() => {
    setUserState(userData);
  }, [userData]);

  // Loading state with Logo
  if (loading) {
    return (
      <div className="bg-[#1A2126] bg-[radial-gradient(ellipse_at_top_right,_rgba(0,100,255,0.3)_0%,_transparent_70%)] flex flex-col items-center justify-center h-screen text-white">
        <Logo />
        <p className="mt-6 text-lg text-gray-400">Loading...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-[#1A2126] bg-[radial-gradient(ellipse_at_top_right,_rgba(0,100,255,0.3)_0%,_transparent_70%)] h-screen flex items-center justify-center text-red-400 text-lg">
        {error}
      </div>
    );
  }

  // No user data state
  if (!userState) {
    return (
      <div className="bg-[#1A2126] bg-[radial-gradient(ellipse_at_top_right,_rgba(0,100,255,0.3)_0%,_transparent_70%)] h-screen flex items-center justify-center text-white">
        No user data available.
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'preferences':
        return <PreferencesContent />;
      case '2fa':
        return <TwoFactorAuthContent userData={userState} onUpdate={setUserState} />;
      case 'profile':
      default:
        return <UserProfileContent userData={userState} onUpdate={setUserState} />;
    }
  };

  return (
    // <div className="bg-[#1A2126] bg-[radial-gradient(ellipse_at_top_right,_rgba(0,100,255,0.3)_0%,_transparent_70%)] text-white font-sans h-screen overflow-hidden">
    <div className="ping-pong-bg min-h-screen">
      <div className="flex h-full">
        <Sidebar avatar={userState.avatar} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header currentUser={userState} />
          <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
              <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}