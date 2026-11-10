import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { settingsApi, profileApi } from '../../services/index.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { Card, CardBody } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input, Field } from '../../components/ui/Input.jsx';
import { Switch } from '../../components/ui/Switch.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { PageLoader } from '../../components/ui/Spinner.jsx';
import { useConfirm } from '../../contexts/ConfirmContext.jsx';
import favv1Background from '../../../assets/background/favv1.png';
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
  ChevronRight,
} from 'lucide-react';

const sections = [
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'editor', label: 'Editor', icon: PenLine },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: ShieldCheck },
];

const allowedAvatarTypes = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

function getInitials(name, email) {
  return (name || email || 'U')
    .trim()
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
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
          {eyebrow}
        </p>
      )}
      <h2 className="text-lg font-semibold text-text-main">{title}</h2>
      {description && (
        <p className="mt-1 text-sm leading-relaxed text-text-muted">
          {description}
        </p>
      )}
    </div>
  );
}

export default function Settings() {
  const { user, profile, refreshProfile, signOut, setProfile } = useAuth();
  const { setParentTheme } = useTheme();
  const confirm = useConfirm();
  const navigate = useNavigate();

  const avatarInput = useRef(null);
  const avatarFileRef = useRef(null);

  const [form, setForm] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [activeSection, setActiveSection] = useState('profile');

  // Initialize settings
  useEffect(() => {
    if (!profile) return;

    setForm({
      full_name: profile.full_name || '',
      parent_theme: profile.parent_theme || 'system',
      floral_intensity: profile.floral_intensity ?? 60,
      reduced_motion: !!profile.reduced_motion,
      floating_petals: profile.floating_petals ?? true,
      autosave_enabled: profile.autosave_enabled ?? true,
      default_landing_page: profile.default_landing_page || 'dashboard',
      notif_reminders: profile.notif_reminders ?? true,
      notif_account: profile.notif_account ?? true,
    });

    if (!avatarFileRef.current) {
      setAvatarPreview(profile.avatar_url || profile.avatar || '');
    }
  }, [profile]);

  // Active sidebar section observer
  useEffect(() => {
    const elements = sections
      .map(({ id }) => document.getElementById(`settings-${id}`))
      .filter(Boolean);

    if (!elements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {
          setActiveSection(
            visible[0].target.id.replace('settings-', '')
          );
        }
      },
      {
        rootMargin: '-18% 0px -62% 0px',
        threshold: [0, 0.1, 0.25, 0.5],
      }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  // Cleanup temporary avatar preview
  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // Save settings
  const save = useMutation({
    mutationFn: (values) => settingsApi.update(values),
    onSuccess: async () => {
      await refreshProfile();
      toast.success('Settings saved successfully.');
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to save settings.');
    },
  });

  // Avatar upload
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

  onSuccess: async (uploadedProfile) => {
    avatarFileRef.current = null;
    setAvatarFile(null);

    if (avatarInput.current) {
      avatarInput.current.value = '';
    }

    // Immediately update the global profile.
    if (uploadedProfile?.avatar_url) {
      setProfile(uploadedProfile);
      setAvatarPreview(uploadedProfile.avatar_url);
    } else {
      console.error(
        '[BloomNotes] Avatar upload response has no avatar_url:',
        uploadedProfile
      );
    }

    // Fetch the latest profile and signed avatar URL.
    const refreshedProfile = await refreshProfile();

    if (refreshedProfile?.avatar_url) {
      setProfile(refreshedProfile);
      setAvatarPreview(refreshedProfile.avatar_url);
    } else if (!uploadedProfile?.avatar_url) {
      toast.error('Photo uploaded, but its display URL could not be generated.');
      return;
    }

    toast.success('Profile photo uploaded successfully.');
  },

  onError: (error) => {
    console.error('[BloomNotes] Avatar upload failed:', error);
    toast.error(error.message || 'Unable to upload profile photo.');
  },
});

  // Delete account
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

  if (!form) return <PageLoader />;

  const update = (patch) => {
    setForm((previous) => ({ ...previous, ...patch }));
  };

  // Avatar selection
  const handleAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = '';

    if (!allowedAvatarTypes.includes(file.type)) {
      toast.error('Please select a JPG, PNG or WebP image.');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error('Image size must be below 5 MB.');
      return;
    }

    if (avatarPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    avatarFileRef.current = file;
    setAvatarFile(file);
    setAvatarPreview(previewUrl);

    toast.success('Photo selected. Click Upload photo to save it.');
  };

  const removeSelectedAvatar = () => {
    if (avatarPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }

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

  const handleTheme = (theme) => {
    update({ parent_theme: theme });
    setParentTheme(theme);
  };

  const handleSave = () => {
    if (!form.full_name.trim()) {
      toast.error('Please enter your name.');
      return;
    }

    save.mutate(form);
  };

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
    });

    setParentTheme('system');
    toast.success('Appearance settings reset.');
  };

  const handleDeleteAccount = async () => {
    const ok = await confirm({
      title: 'Delete account permanently?',
      description:
        'All your notes, journal entries, vault files and personal data will be permanently removed. This cannot be undone.',
      confirmText: 'Delete my account',
      danger: true,
    });

    if (ok) delAccount.mutate();
  };

  const accountEmail = user?.email || profile?.email || '';
  const initials = getInitials(form.full_name, accountEmail);
  const isAvatarUploading = avatarUpload.isPending;
  const isSaving = save.isPending;

  return (
    <div className="relative isolate min-h-screen overflow-x-clip">

      {/* Background wallpaper */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <img
          src={favv1Background}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_32%] sm:object-center"
        />
        <div className="absolute inset-0 bg-[#FFF8FA]/55 dark:bg-[#130B10]/65" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-[#E9B9C9]/20 dark:from-black/10 dark:via-transparent dark:to-[#6E304A]/20" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-3 pb-32 pt-4 sm:px-6 sm:pb-28 sm:pt-7 lg:px-8 lg:pb-24">

        {/* Page heading */}
        <div className="mb-7 rounded-[28px] border border-white/65 bg-white/55 p-5 shadow-[0_18px_55px_rgba(83,38,57,0.10)] backdrop-blur-md dark:border-white/10 dark:bg-[#21151C]/65 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-xs text-text-muted">
                <Settings2 size={14} />
                <span>Account</span>
                <ChevronRight size={13} />
                <span className="text-text-main">Settings</span>
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-text-main sm:text-4xl">
                Settings
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
                Manage your profile, personalize your workspace and control your preferences.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-4 py-2.5 text-xs font-medium text-text-main shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                <CheckCircle2 size={14} className="text-accent" />
                Your account preferences
              </div>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/65 px-3.5 py-2 text-xs font-medium text-text-muted shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
              <CheckCircle2 size={14} className="text-accent" />
              Changes are saved when you select Save
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[210px_minmax(0,1fr)] lg:gap-8">

          {/* Sidebar */}
          <aside className="sticky top-2 z-30 -mx-1 self-start md:top-6 md:mx-0">
            <div className="rounded-[20px] border border-white/75 bg-white/80 p-2 shadow-[0_12px_35px_rgba(83,38,57,0.10)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#21151C]/85 sm:rounded-[24px] sm:p-2.5">

              <p className="hidden px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted md:block">
                Preferences
              </p>

              <nav className="flex snap-x snap-mandatory gap-1 overflow-x-auto overscroll-x-contain pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-col md:overflow-visible md:pb-0">
                {sections.map(({ id, label, icon: Icon }) => {
                  const isActive = activeSection === id;

                  return (
                    <a
                      key={id}
                      href={`#settings-${id}`}
                      aria-current={isActive ? 'location' : undefined}
                      onClick={() => setActiveSection(id)}
                      className={`group relative flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-3 text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-[#F5EAF2] font-semibold text-[#A84F7D] shadow-sm dark:bg-[#553247]/45 dark:text-[#F0A9C8]'
                          : 'text-text-muted hover:bg-white/65 hover:text-text-main dark:hover:bg-white/5'
                      }`}
                    >
                      {/* Desktop active indicator */}
                      <span
                        aria-hidden="true"
                        className={`absolute bottom-3 left-0 top-3 hidden w-[3px] rounded-full transition-all md:block ${
                          isActive ? 'bg-[#C66D98]' : 'opacity-0'
                        }`}
                      />

                      {/* Mobile active indicator */}
                      <span
                        aria-hidden="true"
                        className={`absolute bottom-0 left-3 right-3 h-[3px] rounded-full transition-all md:hidden ${
                          isActive ? 'bg-[#C66D98]' : 'opacity-0'
                        }`}
                      />

                      <Icon
                        size={18}
                        className={`shrink-0 transition-colors ${
                          isActive
                            ? 'text-[#B85F8A] dark:text-[#F0A9C8]'
                            : 'group-hover:text-accent'
                        }`}
                      />

                      <span>{label}</span>

                      {isActive && (
                        <span className="ml-auto hidden text-[9px] font-bold uppercase tracking-[0.14em] text-[#B85F8A]/80 md:block dark:text-[#F0A9C8]/80">
                          Active
                        </span>
                      )}
                    </a>
                  );
                })}
              </nav>

              <div className="mt-3 hidden border-t border-border px-3 pb-2 pt-3 md:block">
                <p className="text-xs leading-relaxed text-text-muted">
                  Customize BloomNotes to match your writing habits.
                </p>
              </div>
            </div>

            {/* Account summary */}
            <div className="mt-4 hidden rounded-[24px] border border-white/70 bg-white/65 p-4 shadow-[0_12px_35px_rgba(83,38,57,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[#21151C]/70 md:block">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 aspect-square shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-highlight text-sm font-semibold text-accent shadow-md ring-2 ring-white/70 dark:ring-white/10">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-main">
                    {form.full_name || 'Your profile'}
                  </p>
                  <p className="truncate text-xs text-text-muted">
                    {accountEmail || 'Account'}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0 space-y-6 sm:space-y-8">

            {/* Profile */}
            <section id="settings-profile" className="scroll-mt-28 sm:scroll-mt-6">
              <SectionHeading
                eyebrow="Personal information"
                title="Profile"
                description="Manage your public identity and account information."
              />

              <Card>
                <CardBody className="space-y-6 rounded-[22px] p-4 sm:rounded-[26px] sm:p-6 lg:p-7">
                  <div className="flex flex-col gap-4 min-[420px]:flex-row min-[420px]:items-center sm:gap-5">

                    {/* Circular avatar */}
                    <div className="relative shrink-0 self-start">
                      <div className="flex h-28 w-28 aspect-square items-center justify-center overflow-hidden rounded-full border-[3px] border-white/80 bg-highlight text-2xl font-semibold text-accent shadow-xl ring-4 ring-accent/10 dark:border-white/15">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Profile avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          initials || <UserRound size={32} />
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => avatarInput.current?.click()}
                        disabled={isAvatarUploading}
                        className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-surface bg-accent text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
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

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-text-main">
                        Profile picture
                      </h3>

                      <p className="mt-1 text-xs leading-relaxed text-text-muted">
                        Choose a clear image for your BloomNotes account.
                        Supported formats: JPG, PNG and WebP.
                      </p>

                      <p className="mt-1 text-xs text-text-muted">
                        Maximum file size: 5 MB.
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
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
                            className="inline-flex items-center gap-1.5 px-2 py-2 text-xs text-text-muted hover:text-red-500 disabled:opacity-50"
                          >
                            <X size={13} />
                            Cancel
                          </button>
                        )}
                      </div>

                      {avatarFile && (
                        <div className="mt-3 rounded-xl border border-border bg-highlight/50 px-3 py-2.5">
                          <div className="flex min-w-0 items-center gap-2">
                            <ImagePlus size={15} className="shrink-0 text-accent" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium text-text-main">
                                {avatarFile.name}
                              </p>
                              <p className="mt-0.5 text-[11px] text-text-muted">
                                {formatFileSize(avatarFile.size)} · Ready to upload
                              </p>
                            </div>
                            <CheckCircle2 size={15} className="shrink-0 text-accent" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-border" />

                  <Field label="Full name">
                    <Input
                      value={form.full_name}
                      onChange={(event) =>
                        update({ full_name: event.target.value })
                      }
                      placeholder="Enter your full name"
                    />
                  </Field>

                  <Field label="Email address">
                    <Input
                      value={accountEmail}
                      disabled
                      placeholder="Email not available"
                      readOnly
                    />
                    <p className="mt-1.5 text-xs text-text-muted">
                      Your registered email address cannot be changed here.
                    </p>
                  </Field>
                </CardBody>
              </Card>
            </section>

            {/* Appearance */}
            <section id="settings-appearance" className="scroll-mt-28 sm:scroll-mt-6">
              <div className="flex items-end justify-between gap-3">
                <SectionHeading
                  eyebrow="Personalize"
                  title="Appearance"
                  description="Customize the look and feel of your writing space."
                />

                <button
                  type="button"
                  onClick={handleReset}
                  className="mb-4 flex shrink-0 items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-accent"
                >
                  <RotateCcw size={13} />
                  Reset
                </button>
              </div>

              <Card>
                <CardBody className="space-y-6 rounded-[22px] p-4 sm:rounded-[26px] sm:p-6 lg:p-7">
                  <div>
                    <p className="mb-3 text-sm font-semibold text-text-main">
                      Color theme
                    </p>

                    <div className="grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-2 lg:grid-cols-3">
                      {[
                        { id: 'light', label: 'Sakura Blossom', Icon: Sun },
                        { id: 'dark', label: 'Midnight Rose', Icon: Moon },
                        { id: 'system', label: 'System default', Icon: Monitor },
                      ].map(({ id, label, Icon }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => handleTheme(id)}
                          className={`flex min-w-0 items-center gap-3 rounded-2xl border p-3 text-left text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm sm:p-3.5 ${
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

                  <div>
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span className="font-medium text-text-main">
                        Floral intensity
                      </span>
                      <span className="text-xs font-medium tabular-nums text-text-muted">
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

                    <p className="mt-2 text-xs text-text-muted">
                      Control the intensity of decorative floral elements.
                    </p>
                  </div>

                  <div className="border-t border-border" />

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
            <section id="settings-editor" className="scroll-mt-28 sm:scroll-mt-6">
              <SectionHeading
                eyebrow="Writing experience"
                title="Editor"
                description="Configure how you write and organize your notes."
              />

              <Card>
                <CardBody className="space-y-6 rounded-[22px] p-4 sm:rounded-[26px] sm:p-6 lg:p-7">
                  <Switch
                    checked={form.autosave_enabled}
                    onChange={(value) =>
                      update({ autosave_enabled: value })
                    }
                    label="Autosave"
                    description="Automatically save notes while you write."
                  />

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
            <section id="settings-notifications" className="scroll-mt-28 sm:scroll-mt-6">
              <SectionHeading
                eyebrow="Stay updated"
                title="Notifications"
                description="Choose which updates you want to receive."
              />

              <Card>
                <CardBody className="space-y-5 rounded-[22px] p-4 sm:rounded-[26px] sm:p-6 lg:p-7">
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
            <section id="settings-security" className="scroll-mt-28 sm:scroll-mt-6">
              <SectionHeading
                eyebrow="Account protection"
                title="Privacy & Security"
                description="Review how your account and personal data are protected."
              />

              <Card>
                <CardBody className="space-y-4 rounded-[22px] p-4 sm:rounded-[26px] sm:p-6 lg:p-7">
                  {[
                    'Sessions expire after 24 hours of inactivity.',
                    'Database tables use Row Level Security.',
                    'Vault files are stored in a private Storage bucket.',
                    'Service-role credentials are never exposed to the browser.',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <ShieldCheck
                        size={16}
                        className="mt-0.5 shrink-0 text-accent"
                      />
                      <p className="text-sm leading-relaxed text-text-muted">
                        {item}
                      </p>
                    </div>
                  ))}

                  <div className="mt-2 border-t border-border pt-5">
                    <h3 className="mb-1 text-sm font-semibold text-text-main">
                      Account actions
                    </h3>

                    <p className="mb-4 text-xs text-text-muted">
                      Manage your current session or permanently delete your account.
                    </p>

                    <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:flex-wrap">
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

            {/* Responsive save footer */}
            <footer className="sticky bottom-2 z-30 -mx-1 mt-8 rounded-[22px] border border-white/75 bg-white/85 p-3 shadow-[0_16px_45px_rgba(83,38,57,0.16)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#21151C]/90 sm:bottom-4 sm:mx-0 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:rounded-[24px] sm:px-5 sm:py-4">
              <div className="mb-3 min-w-0 sm:mb-0">
                <p className="text-sm font-semibold text-text-main">Save your preferences</p>
                <p className="mt-0.5 text-xs leading-relaxed text-text-muted">
                  Your changes will be applied to your BloomNotes account.
                </p>
              </div>
              <Button
                onClick={handleSave}
                loading={isSaving}
                disabled={isSaving}
                className="!h-11 w-full shrink-0 !rounded-xl !border-0 !bg-gradient-to-r !from-[#B95F8C] !to-[#C9789F] !px-6 !font-semibold !text-white shadow-md shadow-[#B95F8C]/20 transition hover:-translate-y-0.5 hover:shadow-lg sm:w-auto"
              >
                <Save size={16} />
                Save changes
              </Button>
            </footer>
          </main>
        </div>
      </div>

    </div>
  );
}