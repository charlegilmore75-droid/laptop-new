'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Loader2, Save, Globe, Wrench, Upload, Image as ImageIcon, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettingsClient({ settings: initialSettings, locale }: { settings: Record<string, string | null>; locale: string }) {
  const isRTL = locale === 'ar';
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const update = (key: string, value: string) => setSettings((p) => ({ ...p, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
      if (!res.ok) throw new Error();
      toast.success(isRTL ? 'تم حفظ الإعدادات' : 'Settings saved');
    } catch { toast.error('Error'); }
    finally { setSaving(false); }
  };

  const uploadLogo = async (file: File) => {
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      update('siteLogo', url);
      toast.success(isRTL ? 'تم رفع الشعار' : 'Logo uploaded');
    } catch { toast.error(isRTL ? 'فشل رفع الشعار' : 'Upload failed'); }
    finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const field = (key: string, label: string, type: string = 'text', placeholder?: string) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      {type === 'textarea' ? (
        <textarea value={settings[key] || ''} onChange={(e) => update(key, e.target.value)} rows={3} placeholder={placeholder} className="w-full border border-border rounded-xl px-3 py-2.5 bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
      ) : (
        <input type={type} value={settings[key] || ''} onChange={(e) => update(key, e.target.value)} placeholder={placeholder} className="w-full border border-border rounded-xl px-3 py-2.5 bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
      )}
    </div>
  );

  const toggle = (key: string, label: string, description?: string) => (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <span className="text-sm text-foreground font-medium">{label}</span>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button onClick={() => update(key, settings[key] === 'true' ? 'false' : 'true')} className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${settings[key] === 'true' ? 'bg-primary' : 'bg-muted'}`}>
        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform m-0.5 ${settings[key] === 'true' ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-black text-foreground">{isRTL ? 'إعدادات الموقع' : 'Site Settings'}</h1>

      {/* Site Identity */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-border bg-accent/30">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-foreground">{isRTL ? 'هوية الموقع' : 'Site Identity'}</h2>
        </div>
        <div className="p-5 space-y-4">
          {/* Logo Upload */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">{isRTL ? 'شعار الموقع (Logo)' : 'Site Logo'}</label>
            <div className="flex items-center gap-4">
              {settings.siteLogo ? (
                <div className="relative w-20 h-20 rounded-xl border border-border overflow-hidden bg-accent/30 flex-shrink-0">
                  <Image src={settings.siteLogo} alt="logo" fill className="object-contain p-1" />
                  <button onClick={() => update('siteLogo', '')} className="absolute top-1 end-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-7 h-7 text-muted-foreground opacity-50" />
                </div>
              )}
              <div className="flex-1">
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
                <button onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-60">
                  {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isRTL ? 'رفع شعار جديد' : 'Upload New Logo'}
                </button>
                <p className="text-xs text-muted-foreground mt-1">{isRTL ? 'PNG أو SVG شفاف (مستطيلي أو مربع)' : 'Transparent PNG or SVG recommended'}</p>
              </div>
            </div>
          </div>

          {field('siteName', isRTL ? 'اسم الموقع' : 'Site Name', 'text', 'LaptopStore')}
          {field('contactEmail', isRTL ? 'البريد الإلكتروني للتواصل' : 'Contact Email', 'email')}
          {field('contactPhone', isRTL ? 'رقم الهاتف' : 'Phone Number')}
          {field('address', isRTL ? 'العنوان' : 'Address', 'textarea')}
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-border bg-accent/30">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-foreground">{isRTL ? 'وسائل التواصل' : 'Social Media'}</h2>
        </div>
        <div className="p-5 grid grid-cols-1 gap-4">
          {field('facebook', 'Facebook', 'text', 'https://facebook.com/...')}
          {field('instagram', 'Instagram', 'text', 'https://instagram.com/...')}
          {field('twitter', 'Twitter/X', 'text', 'https://twitter.com/...')}
          {field('whatsapp', 'WhatsApp', 'text', '+963...')}
        </div>
      </div>

      {/* General Toggles */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-border bg-accent/30">
          <Wrench className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-foreground">{isRTL ? 'إعدادات عامة' : 'General Settings'}</h2>
        </div>
        <div className="p-5">
          {toggle('maintenanceMode', isRTL ? 'وضع الصيانة' : 'Maintenance Mode', isRTL ? 'إيقاف الموقع مؤقتاً للصيانة' : 'Temporarily take site offline')}
          {toggle('walletEnabled', isRTL ? 'تفعيل نظام المحفظة' : 'Enable Wallet System', isRTL ? 'السماح للمستخدمين بشحن وصرف الرصيد' : 'Allow users to top-up and spend balance')}
          {toggle('otpEnabled',
            isRTL ? 'التحقق عبر كود OTP عند التسجيل' : 'OTP Verification on Registration',
            isRTL ? 'إيقاف هذا الخيار يسمح بالتسجيل بالإيميل وكلمة المرور فقط بدون كود' : 'Disabling this allows registration with email + password only, no code'
          )}
          {toggle('reviewsEnabled', isRTL ? 'تفعيل تقييمات المنتجات' : 'Enable Product Reviews')}
          {toggle('couponEnabled', isRTL ? 'تفعيل الكوبونات' : 'Enable Coupons')}
        </div>
      </div>

      <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {isRTL ? 'حفظ الإعدادات' : 'Save Settings'}
      </button>
    </div>
  );
}
