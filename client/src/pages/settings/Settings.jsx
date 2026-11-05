
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { settingsApi, profileApi } from '../../services/index.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { Card, CardBody, CardHeader, CardTitle } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input, Field } from '../../components/ui/Input.jsx';
import { Switch } from '../../components/ui/Switch.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { PageLoader } from '../../components/ui/Spinner.jsx';
import { useConfirm } from '../../contexts/ConfirmContext.jsx';
import {
  Sun,
  Moon,
  Monitor,
  LogOut,
  Trash2,
  UserRound,
  Camera,
  Palette,
  PenLine,
  Bell,
  ShieldCheck,
  Save,
  RotateCcw,
  Upload,
  ImagePlus,
  CheckCircle2,
  X,
  Settings2,
  User,
  ChevronRight,
} from 'lucide-react';

const sections = [
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'editor', label: 'Editor', icon: PenLine },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: ShieldCheck },
];

const allowedAvatarTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

function getInitials(name, email) {
  const value = (name || email || 'U').trim();

  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

function formatFileSize(bytes) {
  if (!bytes) return '0 KB';
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-4">
      {eyebrow && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent mb-1.5">
          {eyebrow}
        </p>
      )}

      <h2 className="text-lg font-semibold text-text-main">
        {title}
      </h2>

      {description && (
        <p className="text-sm text-text-muted mt-1 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

export default function Settings() {
  const { profile, refreshProfile, signOut } = useAuth();
  const { setParentTheme } = useTheme();
  const confirm = useConfirm();
  const navigate = useNavigate();

  const avatarInput = useRef(null);
  const avatarFileRef = useRef(null);

  const [form, setForm] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);

  // --------------------------------------------------
  // Initialize profile settings
  // --------------------------------------------------

  useEffect(() => {
    if (!profile) return;

    setForm({
      full_name: profile.full_name || '',
      parent_theme: profile.parent_theme || 'system',
      floral_intensity: profile.floral_intensity ?? 60,
      reduced_motion: !!profile.reduced_motion,
      floating_petals: profile.floating_petals ?? true,
      editor_font_size: profile.editor_font_size ?? 15,
      autosave_enabled: profile.autosave_enabled ?? true,
      default_landing_page: profile.default_landing_page || 'dashboard',
      notif_reminders: profile.notif_reminders ?? true,
      notif_account: profile.notif_account ?? true,
    });

    if (!avatarFileRef.current) {
      setAvatarPreview(profile.avatar_url || profile.avatar || '');
    }
  }, [profile]);

  // --------------------------------------------------
  // Cleanup temporary image preview
  // --------------------------------------------------

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // --------------------------------------------------
  // Save general settings
  // --------------------------------------------------

  const save = useMutation({
    mutationFn: async (values) => {
      return settingsApi.update(values);
    },

    onSuccess: async () => {
      await refreshProfile();
      toast.success('Settings saved successfully.');
    },

    onError: (error) => {
      toast.error(error.message || 'Unable to save settings.');
    },
  });

  // --------------------------------------------------
  // Upload profile avatar
  // --------------------------------------------------

  const avatarUpload = useMutation({
    mutationFn: async (file) => {
      if (!(file instanceof File)) {
        throw new Error('Please select an avatar image.');
      }

      if (!allowedAvatarTypes.includes(file.type)) {
        throw new Error('Please select a JPG, PNG or WebP image.');
      }

      if (file.size > MAX_AVATAR_SIZE) {
        throw new Error('Image size must be below 5 MB.');
      }

      return profileApi.uploadAvatar(file);
    },

    onSuccess: async () => {
      avatarFileRef.current = null;
      setAvatarFile(null);

      if (avatarInput.current) {
        avatarInput.current.value = '';
      }

      await refreshProfile();

      toast.success('Profile photo uploaded successfully.');
    },

    onError: (error) => {
      toast.error(error.message || 'Unable to upload profile photo.');
    },
  });

  // --------------------------------------------------
  // Delete account
  // --------------------------------------------------

  const delAccount = useMutation({
    mutationFn: () => profileApi.remove(),

    onSuccess: () => {
      toast.success('Account deleted.');
      navigate('/');
    },

    onError: (error) => {
      toast.error(error.message || 'Unable to delete account.');
    },
  });

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  if (!form) return <PageLoader />;

  const update = (patch) => {
    setForm((previous) => ({
      ...previous,
      ...patch,
    }));
  };

  // --------------------------------------------------
  // Avatar selection
  // --------------------------------------------------

  const handleAvatar = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // Reset input so the same image can be selected again.
    event.target.value = '';

    if (!allowedAvatarTypes.includes(file.type)) {
      toast.error('Please select a JPG, PNG or WebP image.');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error('Image size must be below 5 MB.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    avatarFileRef.current = file;
    setAvatarFile(file);
    setAvatarPreview(previewUrl);

    toast.success('Photo selected. Click Upload photo to save it.');
  };

  const removeSelectedAvatar = () => {
    avatarFileRef.current = null;
    setAvatarFile(null);

    if (avatarInput.current) {
      avatarInput.current.value = '';
    }

    setAvatarPreview(profile?.avatar_url || profile?.avatar || '');
  };

  const handleAvatarUpload = () => {
    const file = avatarFileRef.current;

    if (!(file instanceof File)) {
      toast.error('Please select an avatar image first.');
      return;
    }

    avatarUpload.mutate(file);
  };

  // --------------------------------------------------
  // Theme
  // --------------------------------------------------

  const handleTheme = (theme) => {
    update({ parent_theme: theme });
    setParentTheme(theme);
  };

  // --------------------------------------------------
  // Save settings
  // --------------------------------------------------

  const handleSave = () => {
    if (!form.full_name.trim()) {
      toast.error('Please enter your name.');
      return;
    }

    save.mutate(form);
  };

  // --------------------------------------------------
  // Reset appearance
  // --------------------------------------------------

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Reset appearance settings?',
      description:
        'Your appearance preferences will be restored to their default values.',
      confirmText: 'Reset',
    });

    if (!ok) return;

    update({
      parent_theme: 'system',
      floral_intensity: 60,
      reduced_motion: false,
      floating_petals: true,
      editor_font_size: 15,
    });

    setParentTheme('system');

    toast.success('Appearance settings reset.');
  };

  // --------------------------------------------------
  // Delete account
  // --------------------------------------------------

  const handleDeleteAccount = async () => {
    const ok = await confirm({
      title: 'Delete account permanently?',
      description:
        'All your notes, journal entries, vault files and personal data will be permanently removed. This cannot be undone.',
      confirmText: 'Delete my account',
      danger: true,
    });

    if (ok) {
      delAccount.mutate();
    }
  };

  const initials = getInitials(form.full_name, profile?.email);

  const isAvatarUploading = avatarUpload.isPending;
  const isSaving = save.isPending;

  return (
    <div className="min-h-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-9 pb-32">

        {/* Page heading */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
              <Settings2 size={14} />
              <span>Account</span>
              <ChevronRight size={13} />
              <span className="text-text-main">Settings</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-main">
              Settings
            </h1>

            <p className="text-sm text-text-muted mt-2">
              Manage your profile, personalize your workspace and control your preferences.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-text-muted border border-border rounded-xl px-3 py-2 bg-surface self-start sm:self-auto">
            <CheckCircle2 size={14} className="text-accent" />
            Your account preferences
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[210px_minmax(0,1fr)] gap-6 lg:gap-8">

          {/* Sidebar */}
          <aside className="md:sticky md:top-6 md:self-start">
            <div className="rounded-2xl border border-border bg-surface p-2">
              <p className="px-3 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                Preferences
              </p>

              <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
                {sections.map(({ id, label, icon: Icon }) => (
                  <a
                    key={id}
                    href={`#settings-${id}`}
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-muted hover:text-text-main hover:bg-highlight transition-colors whitespace-nowrap"
                  >
                    <Icon
                      size={17}
                      className="shrink-0 group-hover:text-accent transition-colors"
                    />

                    <span>{label}</span>
                  </a>
                ))}
              </nav>

              <div className="hidden md:block border-t border-border mt-3 pt-3 px-3 pb-2">
                <p className="text-xs text-text-muted leading-relaxed">
                  Customize BloomNotes to match your writing habits.
                </p>
              </div>
            </div>

            {/* Account summary */}
            <div className="hidden md:block mt-4 rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-highlight border border-border overflow-hidden flex items-center justify-center text-sm font-semibold text-accent shrink-0">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-main truncate">
                    {form.full_name || 'Your profile'}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {profile?.email || 'Account'}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0 space-y-7">

            {/* Profile */}
            <section id="settings-profile" className="scroll-mt-6">
              <SectionHeading
                eyebrow="Personal information"
                title="Profile"
                description="Manage your public identity and account information."
              />

              <Card>
                <CardBody className="p-4 sm:p-6 space-y-6">

                  {/* Avatar area */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="relative shrink-0 self-start">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-highlight border border-border flex items-center justify-center text-2xl font-semibold text-accent">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Profile avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initials || <UserRound size={32} />
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => avatarInput.current?.click()}
                        disabled={isAvatarUploading}
                        className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center border-[3px] border-surface hover:opacity-90 disabled:opacity-50 transition-opacity"
                        aria-label="Change profile photo"
                      >
                        <Camera size={15} />
                      </button>

                      <input
                        ref={avatarInput}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleAvatar}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-text-main">
                        Profile picture
                      </h3>

                      <p className="text-xs text-text-muted mt-1 leading-relaxed">
                        Choose a clear image for your BloomNotes account.
                        Supported formats: JPG, PNG and WebP.
                      </p>

                      <p className="text-xs text-text-muted mt-1">
                        Maximum file size: 5 MB.
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => avatarInput.current?.click()}
                          disabled={isAvatarUploading}
                        >
                          <ImagePlus size={14} />
                          Choose image
                        </Button>

                        {avatarFile && (
                          <Button
                            size="sm"
                            onClick={handleAvatarUpload}
                            loading={isAvatarUploading}
                            disabled={isAvatarUploading}
                          >
                            <Upload size={14} />
                            Upload photo
                          </Button>
                        )}

                        {avatarFile && (
                          <button
                            type="button"
                            onClick={removeSelectedAvatar}
                            disabled={isAvatarUploading}
                            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-red-500 px-2 py-2 disabled:opacity-50"
                          >
                            <X size={13} />
                            Cancel
                          </button>
                        )}
                      </div>

                      {avatarFile && (
                        <div className="mt-3 rounded-xl border border-border bg-highlight/50 px-3 py-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <ImagePlus size={15} className="text-accent shrink-0" />

                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-text-main truncate">
                                {avatarFile.name}
                              </p>
                              <p className="text-[11px] text-text-muted mt-0.5">
                                {formatFileSize(avatarFile.size)} · Ready to upload
                              </p>
                            </div>

                            <CheckCircle2 size={15} className="text-accent shrink-0" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-border" />

                  {/* Full name */}
                  <Field label="Full name">
                    <Input
                      value={form.full_name}
                      onChange={(event) =>
                        update({ full_name: event.target.value })
                      }
                      placeholder="Enter your full name"
                    />
                  </Field>

                  {/* Email */}
                  <Field label="Email address">
                    <Input
                      value={profile?.email || ''}
                      disabled
                    />

                    <p className="text-xs text-text-muted mt-1.5">
                      Your registered email address cannot be changed here.
                    </p>
                  </Field>
                </CardBody>
              </Card>
            </section>

            {/* Appearance */}
            <section id="settings-appearance" className="scroll-mt-6">
              <div className="flex items-end justify-between gap-3">
                <SectionHeading
                  eyebrow="Personalize"
                  title="Appearance"
                  description="Customize the look and feel of your writing space."
                />

                <button
                  type="button"
                  onClick={handleReset}
                  className="mb-4 shrink-0 text-xs font-medium text-text-muted hover:text-accent flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw size={13} />
                  Reset
                </button>
              </div>

              <Card>
                <CardBody className="p-4 sm:p-6 space-y-6">

                  {/* Theme */}
                  <div>
                    <p className="text-sm font-semibold text-text-main mb-3">
                      Color theme
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'light', label: 'Sakura Blossom', Icon: Sun },
                        { id: 'dark', label: 'Midnight Rose', Icon: Moon },
                        { id: 'system', label: 'System default', Icon: Monitor },
                      ].map(({ id, label, Icon }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => handleTheme(id)}
                          className={`flex items-center gap-3 rounded-xl border p-3.5 text-sm transition-all ${
                            form.parent_theme === id
                              ? 'border-accent bg-highlight text-accent ring-1 ring-accent/20'
                              : 'border-border text-text-main hover:bg-highlight'
                          }`}
                        >
                          <Icon size={18} />
                          <span className="font-medium">{label}</span>
                          {form.parent_theme === id && (
                            <CheckCircle2 size={15} className="ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border" />

                  {/* Floral intensity */}
                  <div>
                    <div className="flex justify-between items-center text-sm mb-3">
                      <span className="font-medium text-text-main">
                        Floral intensity
                      </span>
                      <span className="text-xs font-medium text-text-muted tabular-nums">
                        {form.floral_intensity}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={form.floral_intensity}
                      onChange={(event) =>
                        update({
                          floral_intensity: Number(event.target.value),
                        })
                      }
                      className="w-full accent-accent"
                    />

                    <p className="text-xs text-text-muted mt-2">
                      Control the intensity of decorative floral elements.
                    </p>
                  </div>

                  <div className="border-t border-border" />

                  {/* Motion */}
                  <div className="space-y-5">
                    <Switch
                      checked={form.floating_petals}
                      onChange={(value) =>
                        update({ floating_petals: value })
                      }
                      label="Floating petals"
                      description="Show subtle animated petals in the background."
                    />

                    <Switch
                      checked={form.reduced_motion}
                      onChange={(value) =>
                        update({ reduced_motion: value })
                      }
                      label="Reduced motion"
                      description="Reduce animations and transitions throughout the app."
                    />
                  </div>
                </CardBody>
              </Card>
            </section>

            {/* Editor */}
            <section id="settings-editor" className="scroll-mt-6">
              <SectionHeading
                eyebrow="Writing experience"
                title="Editor"
                description="Configure how you write and organize your notes."
              />

              <Card>
                <CardBody className="p-4 sm:p-6 space-y-6">
                  <Switch
                    checked={form.autosave_enabled}
                    onChange={(value) =>
                      update({ autosave_enabled: value })
                    }
                    label="Autosave"
                    description="Automatically save notes while you write."
                  />

                  <div className="border-t border-border" />

                  <div>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="font-medium text-text-main">
                        Editor font size
                      </span>

                      <span className="text-xs text-text-muted tabular-nums">
                        {form.editor_font_size}px
                      </span>
                    </div>

                    <input
                      type="range"
                      min="12"
                      max="22"
                      value={form.editor_font_size}
                      onChange={(event) =>
                        update({
                          editor_font_size: Number(event.target.value),
                        })
                      }
                      className="w-full accent-accent"
                    />
                  </div>

                  <div className="border-t border-border" />

                  <Field label="Default landing page">
                    <Select
                      value={form.default_landing_page}
                      onChange={(event) =>
                        update({
                          default_landing_page: event.target.value,
                        })
                      }
                    >
                      <option value="dashboard">Dashboard</option>
                      <option value="notes">All Notes</option>
                      <option value="journal">Journal</option>
                      <option value="personal-space">Personal Space</option>
                    </Select>
                  </Field>
                </CardBody>
              </Card>
            </section>

            {/* Notifications */}
            <section id="settings-notifications" className="scroll-mt-6">
              <SectionHeading
                eyebrow="Stay updated"
                title="Notifications"
                description="Choose which updates you want to receive."
              />

              <Card>
                <CardBody className="p-4 sm:p-6 space-y-5">
                  <Switch
                    checked={form.notif_reminders}
                    onChange={(value) =>
                      update({ notif_reminders: value })
                    }
                    label="Reminder notifications"
                    description="Get notified when your reminders are due."
                  />

                  <div className="border-t border-border" />

                  <Switch
                    checked={form.notif_account}
                    onChange={(value) =>
                      update({ notif_account: value })
                    }
                    label="Account notifications"
                    description="Receive important account-related updates."
                  />
                </CardBody>
              </Card>
            </section>

            {/* Security */}
            <section id="settings-security" className="scroll-mt-6">
              <SectionHeading
                eyebrow="Account protection"
                title="Privacy & Security"
                description="Review how your account and personal data are protected."
              />

              <Card>
                <CardBody className="p-4 sm:p-6 space-y-4">
                  {[
                    'Sessions expire after 24 hours of inactivity.',
                    'Database tables use Row Level Security.',
                    'Vault files are stored in a private Storage bucket.',
                    'Service-role credentials are never exposed to the browser.',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <ShieldCheck
                        size={16}
                        className="text-accent shrink-0 mt-0.5"
                      />
                      <p className="text-sm text-text-muted leading-relaxed">
                        {item}
                      </p>
                    </div>
                  ))}

                  <div className="border-t border-border pt-5 mt-2">
                    <h3 className="text-sm font-semibold text-text-main mb-1">
                      Account actions
                    </h3>

                    <p className="text-xs text-text-muted mb-4">
                      Manage your current session or permanently delete your account.
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => signOut()}
                      >
                        <LogOut size={14} />
                        Sign out
                      </Button>

                      <Button
                        variant="danger"
                        loading={delAccount.isPending}
                        onClick={handleDeleteAccount}
                      >
                        <Trash2 size={14} />
                        Delete account
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </section>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-3">
              <p className="text-xs text-text-muted">
                BloomNotes · Your personal writing space
              </p>

              <p className="text-xs text-text-muted">
                Your preferences are saved to your account.
              </p>
            </div>
          </main>
        </div>
      </div>

      {/* Fixed save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface/95 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="hidden sm:block min-w-0">
              <p className="text-sm font-medium text-text-main">
                Settings
              </p>
              <p className="text-xs text-text-muted">
                Save your preference changes.
              </p>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isSaving}
              >
                Cancel
              </Button>

              <Button
                onClick={handleSave}
                loading={isSaving}
                disabled={isSaving}
              >
                <Save size={15} />
                Save changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
