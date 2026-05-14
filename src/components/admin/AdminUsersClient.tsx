'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, ShieldOff, Loader2, User, Wallet, X, Plus, Minus, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate, formatPrice, cn } from '@/lib/utils';

interface UserItem {
  id: string; name?: string | null; email: string; role: string; isBanned: boolean;
  emailVerified?: string | null; createdAt: string;
  _count: { orders: number };
  wallet?: { balance: number } | null;
}

export default function AdminUsersClient({ users: initialUsers, locale }: { users: UserItem[]; locale: string }) {
  const isRTL = locale === 'ar';
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [walletModal, setWalletModal] = useState<UserItem | null>(null);
  const [walletAction, setWalletAction] = useState<'ADD' | 'SUBTRACT' | 'SET'>('ADD');
  const [walletAmount, setWalletAmount] = useState('');
  const [walletNote, setWalletNote] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.email.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q);
  });

  const toggleBan = async (userId: string, isBanned: boolean) => {
    setTogglingId(userId);
    try {
      await fetch(`/api/admin/users/${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isBanned: !isBanned }) });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isBanned: !isBanned } : u));
      toast.success(isRTL ? (!isBanned ? 'تم حظر المستخدم' : 'تم رفع الحظر') : (!isBanned ? 'User banned' : 'User unbanned'));
    } catch { toast.error('Error'); }
    finally { setTogglingId(null); }
  };

  const openWalletModal = (user: UserItem) => {
    setWalletModal(user);
    setWalletAction('ADD');
    setWalletAmount('');
    setWalletNote('');
  };

  const handleWalletUpdate = async () => {
    if (!walletModal) return;
    const amount = parseFloat(walletAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error(isRTL ? 'أدخل مبلغاً صحيحاً' : 'Enter a valid amount');
      return;
    }
    setWalletLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${walletModal.id}/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: walletAction, amount, description: walletNote }),
      });
      if (!res.ok) throw new Error();
      const { newBalance } = await res.json();
      setUsers((prev) => prev.map((u) => u.id === walletModal.id ? { ...u, wallet: { balance: newBalance } } : u));
      toast.success(isRTL ? `تم تحديث رصيد ${walletModal.name || walletModal.email}` : `Balance updated for ${walletModal.name || walletModal.email}`);
      setWalletModal(null);
    } catch { toast.error(isRTL ? 'حدث خطأ' : 'An error occurred'); }
    finally { setWalletLoading(false); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-foreground">{isRTL ? 'المستخدمون' : 'Users'}</h1>
      <div className="relative">
        <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isRTL ? 'بحث...' : 'Search...'} className="w-full border border-border rounded-xl px-4 py-3 ps-11 bg-card text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-accent/50 border-b border-border">
                {[isRTL ? 'المستخدم' : 'User', isRTL ? 'الدور' : 'Role', isRTL ? 'الطلبات' : 'Orders', isRTL ? 'رصيد المحفظة' : 'Wallet', isRTL ? 'انضم في' : 'Joined', isRTL ? 'الحالة' : 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground"><User className="w-10 h-10 mx-auto mb-2 opacity-30" /></td></tr>
              ) : filtered.map((user, i) => (
                <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-border hover:bg-accent/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{user.name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-semibold', user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-secondary text-muted-foreground')}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{user._count.orders}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openWalletModal(user)} className="flex items-center gap-1.5 hover:text-primary transition-colors group">
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary">{formatPrice(user.wallet?.balance || 0)}</span>
                      <Wallet className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(user.createdAt, locale)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-semibold', user.isBanned ? 'bg-red-100 text-red-700' : user.emailVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>
                      {user.isBanned ? (isRTL ? 'محظور' : 'Banned') : user.emailVerified ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'غير متحقق' : 'Unverified')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openWalletModal(user)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                        <Wallet className="w-3 h-3" />
                        {isRTL ? 'رصيد' : 'Balance'}
                      </button>
                      {user.role === 'USER' && (
                        <button
                          onClick={() => toggleBan(user.id, user.isBanned)}
                          disabled={togglingId === user.id}
                          className={cn('flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors', user.isBanned ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-700 hover:bg-red-100')}
                        >
                          {togglingId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : user.isBanned ? <ShieldOff className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                          {user.isBanned ? (isRTL ? 'رفع الحظر' : 'Unban') : (isRTL ? 'حظر' : 'Ban')}
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {walletModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setWalletModal(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-md bg-card border border-border rounded-3xl p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{isRTL ? 'تعديل رصيد المحفظة' : 'Edit Wallet Balance'}</h2>
                  <p className="text-sm text-muted-foreground">{walletModal.name || walletModal.email}</p>
                </div>
                <button onClick={() => setWalletModal(null)} className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>

              <div className="bg-accent/50 rounded-2xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">{isRTL ? 'الرصيد الحالي' : 'Current Balance'}</p>
                <p className="text-3xl font-black text-primary">{formatPrice(walletModal.wallet?.balance || 0)}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'ADD', icon: Plus, label: isRTL ? 'إضافة' : 'Add', color: 'text-green-600 bg-green-50 hover:bg-green-100 border-green-200' },
                  { value: 'SUBTRACT', icon: Minus, label: isRTL ? 'خصم' : 'Subtract', color: 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200' },
                  { value: 'SET', icon: RotateCcw, label: isRTL ? 'تعيين' : 'Set to', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setWalletAction(opt.value)}
                    className={cn('flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm font-semibold transition-all', opt.color, walletAction === opt.value ? 'ring-2 ring-offset-1 ring-current' : '')}
                  >
                    <opt.icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  {walletAction === 'ADD' ? (isRTL ? 'المبلغ المراد إضافته (ل.س)' : 'Amount to add (SYP)')
                    : walletAction === 'SUBTRACT' ? (isRTL ? 'المبلغ المراد خصمه (ل.س)' : 'Amount to subtract (SYP)')
                    : (isRTL ? 'الرصيد الجديد (ل.س)' : 'New balance (SYP)')}
                </label>
                <input
                  type="number"
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value)}
                  min="0"
                  placeholder="0"
                  autoFocus
                  className="w-full border border-border rounded-xl px-4 py-3 bg-background text-foreground text-lg font-bold outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{isRTL ? 'سبب التعديل (اختياري)' : 'Reason (optional)'}</label>
                <input
                  type="text"
                  value={walletNote}
                  onChange={(e) => setWalletNote(e.target.value)}
                  placeholder={isRTL ? 'مثال: هدية، تعويض...' : 'e.g. Gift, compensation...'}
                  className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {walletAmount && !isNaN(parseFloat(walletAmount)) && (
                <div className="bg-accent/50 rounded-xl p-3 text-sm text-center text-muted-foreground">
                  {isRTL ? 'الرصيد بعد التعديل:' : 'Balance after update:'}{' '}
                  <span className="font-black text-foreground">
                    {formatPrice(
                      walletAction === 'SET' ? parseFloat(walletAmount)
                        : walletAction === 'ADD' ? (walletModal.wallet?.balance || 0) + parseFloat(walletAmount)
                        : Math.max(0, (walletModal.wallet?.balance || 0) - parseFloat(walletAmount))
                    )}
                  </span>
                </div>
              )}

              <button
                onClick={handleWalletUpdate}
                disabled={walletLoading || !walletAmount}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {walletLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                {isRTL ? 'تأكيد التعديل' : 'Confirm Update'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
