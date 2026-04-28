import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Lock, Shield, User, Eye, EyeOff, QrCode, Copy, Download, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/toast-context';
import logEvent from '@/hooks/use.logs';

interface SecuritySettingsProps {
  userData: any;
  onUpdate: (data: any) => void;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({ userData, onUpdate }) => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="2fa">2FA Security</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
          <UserProfileSettings userData={userData} onUpdate={onUpdate} />
        </TabsContent>
        
        <TabsContent value="2fa" className="space-y-4">
          <TwoFactorAuthSettings userData={userData} onUpdate={onUpdate} />
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-4">
          <SecurityActivityLog />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const UserProfileSettings: React.FC<{ userData: any; onUpdate: (data: any) => void }> = ({ userData, onUpdate }) => {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error } = useToast();

  useEffect(() => {
    if (userData) {
      const [firstName, ...lastNameParts] = userData.name ? userData.name.split(' ') : ['', ''];
      setFormData({ 
        firstName: firstName || '', 
        lastName: lastNameParts.join(' ') || '', 
        email: userData.email || '', 
        password: '' 
      });
      setAvatarPreview(userData.avatar || 'https://i.pravatar.cc/150');
    }
  }, [userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const payload: any = { 
      name: `${formData.firstName} ${formData.lastName}`.trim(), 
      email: formData.email 
    };
    if (formData.password) payload.password = formData.password;

    try {
      const response = await fetch(`http://localhost:3000/api/v1/user/${userData.id}`, {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        credentials: 'include', 
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update profile.');
      
      success('Profile updated successfully!');
      onUpdate({ ...userData, ...result.data });
    } catch (err: any) {
      error(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          User Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSaveChanges} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <img src={avatarPreview} alt="User Avatar" className="w-20 h-20 rounded-full object-cover" />
            <div>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                Change Photo
              </Button>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" />
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName"
                name="firstName" 
                value={formData.firstName} 
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName"
                name="lastName" 
                value={formData.lastName} 
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email"
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">New Password (optional)</Label>
            <div className="relative">
              <Input 
                id="password"
                type={showPassword ? 'text' : 'password'} 
                name="password" 
                value={formData.password} 
                onChange={handleChange}
                placeholder="Enter new password to change"
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline">Cancel</Button>
            <Button type="submit" disabled={isLoading} className="btn-gaming">
              {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const TwoFactorAuthSettings: React.FC<{ userData: any; onUpdate: (data: any) => void }> = ({ userData, onUpdate }) => {
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();

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
      
      await logEvent({
        level: 'INFO',
        message: 'User successfully enabled two-factor authentication.',
        component: 'auth-service',
        userId: userData.id
      });
      
      setQrCodeDataUrl(result.qrCode);
      setBackupCodes(result.backupCodes);
      setIsSetupModalOpen(true);
    } catch (err: any) {
      error(`Error: ${err.message}`);
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
      
      success('2FA disabled successfully.');
      await logEvent({
        level: 'INFO',
        message: 'User successfully disabled two-factor authentication.',
        component: 'auth-service',
        userId: userData.id
      });
      
      onUpdate({ ...userData, twoFactorEnabled: false });
    } catch (err: any) {
      error(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
            <p className="text-sm text-foreground">
              2FA adds an extra layer of security to your account by requiring a second form of verification.
            </p>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-1">
              <h4 className="font-medium">Authenticator App</h4>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={userData.twoFactorEnabled ? 'default' : 'secondary'}>
                  {userData.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
            <Button
              onClick={userData.twoFactorEnabled ? handleDisable2FA : handleEnable2FA}
              disabled={isLoading}
              variant={userData.twoFactorEnabled ? 'destructive' : 'default'}
              className={userData.twoFactorEnabled ? '' : 'btn-gaming'}
            >
              {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              {isLoading ? 'Processing...' : (userData.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Setup Modal and Backup Codes Modal would go here - simplified for brevity */}
    </>
  );
};

const SecurityActivityLog: React.FC = () => {
  const [securityActivity, setSecurityActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSecurityLogs = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/v1/log/logs`);
        if (!response.ok) throw new Error('Failed to fetch logs.');

        const logs = await response.json();
        const formattedEvents = logs.map((log: any) => ({
          id: log.id,
          activity: log.message,
          date: new Date(log.createdAt).toLocaleString(),
          status: log.level,
          statusColor: log.level === 'error' ? 'text-destructive' : 'text-success',
        }));

        setSecurityActivity(formattedEvents);
      } catch (error) {
        console.error("Error fetching security logs:", error);
        setSecurityActivity([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSecurityLogs();
  }, []);

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Security Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : securityActivity.length > 0 ? (
          <div className="space-y-3">
            {securityActivity.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {item.status === 'error' ? 
                    <AlertTriangle className="h-4 w-4 text-destructive" /> :
                    <CheckCircle className="h-4 w-4 text-success" />
                  }
                  <div>
                    <p className="text-sm font-medium">{item.activity}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                </div>
                <Badge variant={item.status === 'error' ? 'destructive' : 'default'}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No security activity recorded.</p>
        )}
      </CardContent>
    </Card>
  );
};
