import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, User, Users, Settings as SettingsIcon, LogOut, Edit, Moon, Bell } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';

const API_URL = import.meta.env.VITE_API_URL || '';

const mockWhiteboards = [
  { id: 1, title: 'Project Plan', updated: '2024-06-01', collaborators: 3 },
  { id: 2, title: 'UI Sketches', updated: '2024-05-28', collaborators: 1 },
];

const Dashboard = () => {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [whiteboards, setWhiteboards] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState(true);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetch(`${API_URL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setEditName(data.name);
        setEditEmail(data.email);
      });
    setWhiteboards(mockWhiteboards);
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');
    try {
      const token = localStorage.getItem('token');
      const body: any = { name: editName, email: editEmail };
      if (oldPassword || newPassword || confirmPassword) {
        body.oldPassword = oldPassword;
        body.newPassword = newPassword;
        body.confirmPassword = confirmPassword;
      }
      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      setUser(data);
      setEditSuccess('Profile updated!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setEditOpen(false), 1000);
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Settings features (theme/notifications) - placeholder logic
  const handleThemeToggle = () => setTheme(theme === 'light' ? 'dark' : 'light');
  const handleNotificationsToggle = () => setNotifications(n => !n);

  return (
    <div className="min-h-screen bg-muted flex">
      {/* Sidebar/Profile */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 min-h-screen">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
            {user?.name?.[0] || <User />}
          </div>
          <div>
            <div className="font-semibold text-lg">{user?.name}</div>
            <div className="text-xs text-muted-foreground">{user?.email}</div>
          </div>
        </div>
        <nav className="flex flex-col gap-2 mt-4">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="justify-start w-full flex items-center gap-2">
                <Edit className="w-4 h-4" /> Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="backdrop-blur-md bg-white/80">
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>Update your name, email, or change your password.</DialogDescription>
              <form onSubmit={handleProfileUpdate} className="space-y-4 mt-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Name</label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Email</label>
                  <input
                    type="email"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="pt-2">
                  <div className="font-semibold text-sm mb-2">Change Password</div>
                  <input
                    type="password"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 mb-2"
                    placeholder="Old password"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                  />
                  <input
                    type="password"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 mb-2"
                    placeholder="New password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  <input
                    type="password"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
                {editError && <div className="text-red-500 text-sm">{editError}</div>}
                {editSuccess && <div className="text-green-600 text-sm">{editSuccess}</div>}
                <Button type="submit" className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="justify-start w-full flex items-center gap-2">
                <SettingsIcon className="w-4 h-4" /> Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Settings</DialogTitle>
              <DialogDescription>Customize your experience.</DialogDescription>
              <div className="space-y-6 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="w-5 h-5 text-primary" />
                    <span className="font-medium">Dark Mode</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleThemeToggle}>
                    {theme === 'light' ? 'Enable' : 'Disable'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    <span className="font-medium">Notifications</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleNotificationsToggle}>
                    {notifications ? 'On' : 'Off'}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">More settings coming soon...</div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" className="justify-start w-full flex items-center gap-2 text-red-500">
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto py-12 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Your Whiteboards</h1>
            <div className="text-muted-foreground text-sm">Collaborate, create, and organize your boards.</div>
          </div>
          <Button className="bg-primary text-white px-6 py-2 rounded-lg font-semibold shadow flex items-center gap-2" size="lg">
            <Plus className="w-5 h-5" /> New Whiteboard
          </Button>
        </div>
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow p-6 mb-8 flex items-center justify-between">
          <div>
            <div className="font-semibold text-lg">Profile</div>
            <div className="text-muted-foreground text-sm">{user?.email}</div>
          </div>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="ml-4">Edit Profile</Button>
            </DialogTrigger>
            <DialogContent className="backdrop-blur-md bg-white/80">
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>Update your name, email, or change your password.</DialogDescription>
              <form onSubmit={handleProfileUpdate} className="space-y-4 mt-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Name</label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Email</label>
                  <input
                    type="email"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="pt-2">
                  <div className="font-semibold text-sm mb-2">Change Password</div>
                  <input
                    type="password"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 mb-2"
                    placeholder="Old password"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                  />
                  <input
                    type="password"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 mb-2"
                    placeholder="New password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  <input
                    type="password"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
                {editError && <div className="text-red-500 text-sm">{editError}</div>}
                {editSuccess && <div className="text-green-600 text-sm">{editSuccess}</div>}
                <Button type="submit" className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {/* Whiteboards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* New Whiteboard Card */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/30 bg-white rounded-xl p-8 cursor-pointer hover:border-primary/60 transition group min-h-[180px]">
            <Plus className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition" />
            <div className="font-semibold text-primary">Create New Whiteboard</div>
          </div>
          {/* User's Whiteboards */}
          {whiteboards.map(wb => (
            <div key={wb.id} className="bg-white rounded-xl shadow p-6 flex flex-col justify-between min-h-[180px] hover:shadow-lg transition cursor-pointer group border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="font-medium text-lg flex-1 truncate group-hover:text-primary transition">{wb.title}</div>
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{wb.collaborators}</span>
              </div>
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{user?.name?.[0]}</div>
                  <span className="text-xs text-muted-foreground">Owner</span>
                </div>
                <div className="text-xs text-muted-foreground">Last edited: {wb.updated}</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;