'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, UploadCloud, Plus } from 'lucide-react';
import Image from 'next/image';

type SocialLinkData = {
  icon: string;
  iconPublicId?: string;
  link: string;
  _id?: string;
};

type SocialData = {
  _id: string;
  title: string;
  subTitle: string;
  backgroundColor: string;
  textColor: string;
  socialLink?: SocialLinkData[];
};

type SocialFormState = {
  title: string;
  subTitle: string;
  backgroundColor: string;
  textColor: string;
};

type ApiEnvelope<T> = {
  statusCode?: number;
  success?: boolean;
  status?: boolean;
  message?: string;
  data?: T | null;
};

const SOCIAL_ID = '6a0e94317f45df0f7d79d812';

const getApiBase = () => (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');

const hasExplicitFailure = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return false;
  const parsed = payload as ApiEnvelope<unknown>;
  return parsed.success === false || parsed.status === false;
};

const getApiMessage = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return null;
  const parsed = payload as ApiEnvelope<unknown>;
  return typeof parsed.message === 'string' && parsed.message.trim()
    ? parsed.message
    : null;
};

const isValidImageSrc = (value: string | null) => {
  if (!value) return false;
  return (
    value.startsWith('/') ||
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:') ||
    value.startsWith('blob:')
  );
};

export default function SocialContainer() {
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<SocialFormState>({
    title: '',
    subTitle: '',
    backgroundColor: '#000000',
    textColor: '#ffffff',
  });

  const [newLink, setNewLink] = useState('');
  const [newIconFile, setNewIconFile] = useState<File | null>(null);
  const [newPreviewUrl, setNewPreviewUrl] = useState<string | null>(null);

  const apiBase = useMemo(getApiBase, []);
  const socialEndpoint = useMemo(
    () => (apiBase ? `${apiBase}/socialpartership/${SOCIAL_ID}` : `/socialpartership/${SOCIAL_ID}`),
    [apiBase]
  );

  const socialQuery = useQuery({
    queryKey: ['social-data', token],
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await fetch(apiBase ? `${apiBase}/socialpartership` : `/socialpartership`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(payload)) {
        throw new Error(getApiMessage(payload) ?? 'Failed to load social data.');
      }

      // The GET endpoint returns an array, and the first item is the target social object
      const dataArray = payload.data as SocialData[];
      const socialInfo = dataArray.find(item => item._id === SOCIAL_ID) || dataArray[0];
      return socialInfo;
    },
  });

  useEffect(() => {
    if (socialQuery.data) {
      setFormData({
        title: socialQuery.data.title || '',
        subTitle: socialQuery.data.subTitle || '',
        backgroundColor: socialQuery.data.backgroundColor || '#000000',
        textColor: socialQuery.data.textColor || '#ffffff',
      });
    }
  }, [socialQuery.data]);

  useEffect(() => {
    return () => {
      if (newPreviewUrl && newPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(newPreviewUrl);
      }
    };
  }, [newPreviewUrl]);

  const saveInfoMutation = useMutation({
    mutationFn: async (payload: FormData) => {
      const response = await fetch(socialEndpoint, {
        method: 'PUT',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: payload,
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(result)) {
        throw new Error(getApiMessage(result) ?? 'Failed to update social info.');
      }

      return result;
    },
    onSuccess: () => {
      toast.success('Social info updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['social-data', token] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save social info.');
    },
  });

  const addLinkMutation = useMutation({
    mutationFn: async (payload: FormData) => {
      const response = await fetch(`${socialEndpoint}/social-link`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: payload,
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(result)) {
        throw new Error(getApiMessage(result) ?? 'Failed to add social link.');
      }

      return result;
    },
    onSuccess: () => {
      toast.success('Social link added successfully.');
      setNewLink('');
      setNewIconFile(null);
      setNewPreviewUrl(null);
      queryClient.invalidateQueries({ queryKey: ['social-data', token] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add social link.');
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (index: number) => {
      const response = await fetch(`${socialEndpoint}/social-link/${index}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(result)) {
        throw new Error(getApiMessage(result) ?? 'Failed to remove social link.');
      }

      return result;
    },
    onSuccess: () => {
      toast.success('Social link removed successfully.');
      queryClient.invalidateQueries({ queryKey: ['social-data', token] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to remove social link.');
    },
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleInfoSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.title || !formData.subTitle) {
      toast.error('Please fill in both the title and subTitle.');
      return;
    }

    const payload = new FormData();
    payload.append('title', formData.title);
    payload.append('subTitle', formData.subTitle);
    payload.append('backgroundColor', formData.backgroundColor);
    payload.append('textColor', formData.textColor);

    saveInfoMutation.mutate(payload);
  };

  const handleNewIconChange = (file: File | null) => {
    if (newPreviewUrl && newPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(newPreviewUrl);
    }
    setNewIconFile(file);
    setNewPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleAddLink = () => {
    if (!newLink || !newIconFile) {
      toast.error('Please provide both a link and an icon image.');
      return;
    }
    const payload = new FormData();
    payload.append('link', newLink);
    payload.append('icon', newIconFile);

    addLinkMutation.mutate(payload);
  };

  if (status === 'unauthenticated') {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        Please sign in first to manage Social content.
      </div>
    );
  }

  if (status === 'loading' || socialQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />
        <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />
      </div>
    );
  }

  if (socialQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        {socialQuery.error instanceof Error ? socialQuery.error.message : 'Failed to load data.'}
      </div>
    );
  }

  const existingLinks = socialQuery.data?.socialLink || [];

  return (
    <div className="space-y-6 pb-10">
      <div className="w-full">
        {/* Basic Information Section */}
        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm mb-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-[#0F172A]">Social Information</h2>
            <p className="text-sm text-[#64748B] mt-1">Manage the core social and partnership information.</p>
          </div>

          <form onSubmit={handleInfoSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="h-11"
                  placeholder="Social"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="subTitle">Subtitle</Label>
                <Textarea
                  id="subTitle"
                  name="subTitle"
                  value={formData.subTitle}
                  onChange={handleChange}
                  className="min-h-[100px]"
                  placeholder="Be our friend, follow us."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="backgroundColor">Background Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="backgroundColor"
                    name="backgroundColor"
                    type="color"
                    value={formData.backgroundColor}
                    onChange={handleChange}
                    className="h-11 w-20 p-1"
                  />
                  <Input
                    type="text"
                    value={formData.backgroundColor}
                    onChange={handleChange}
                    name="backgroundColor"
                    className="h-11 flex-1 uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="textColor">Text Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="textColor"
                    name="textColor"
                    type="color"
                    value={formData.textColor}
                    onChange={handleChange}
                    className="h-11 w-20 p-1"
                  />
                  <Input
                    type="text"
                    value={formData.textColor}
                    onChange={handleChange}
                    name="textColor"
                    className="h-11 flex-1 uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                type="submit"
                disabled={saveInfoMutation.isPending}
                className="h-11 bg-[#FBFF26] px-8 font-semibold text-[#2D3D4D] hover:bg-[#FBFF26]/95 transition-colors"
              >
                {saveInfoMutation.isPending ? 'Saving...' : 'Update Information'}
              </Button>
            </div>
          </form>
        </section>

        {/* Social Links Section */}
        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-[#0F172A]">Social Links</h2>
            <p className="text-sm text-[#64748B] mt-1">Manage individual social media links and their icons.</p>
          </div>

          <div className="space-y-6">
            {existingLinks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] py-8 text-center text-sm text-[#64748B]">
                No social links added yet. Add a new link below.
              </div>
            ) : (
              <div className="space-y-4">
                {existingLinks.map((link, index) => {
                  const safePreviewImage = isValidImageSrc(link.icon) ? link.icon : '';
                  return (
                    <div key={link._id || index} className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                      <div className="flex items-center gap-4">
                        {safePreviewImage ? (
                          <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white p-1">
                            <Image
                              src={safePreviewImage}
                              alt="Social Icon"
                              fill
                              className="object-contain p-1"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gray-200" />
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[#0F172A]">Link {index + 1}</span>
                          <a href={link.link} target="_blank" rel="noreferrer" className="text-xs text-[#0E7490] hover:underline break-all line-clamp-1">
                            {link.link}
                          </a>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => deleteLinkMutation.mutate(index)}
                        disabled={deleteLinkMutation.isPending}
                        className="h-9 w-9 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove Link</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add New Link Form */}
            <div className="mt-8 rounded-xl border border-[#E2E8F0] bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-[#0F172A] flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Social Link
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-link">Social Media Link</Label>
                  <Input
                    id="new-link"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="h-10"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Icon Image</Label>
                  <div className="flex items-center gap-4">
                    <input
                      id="new-icon"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleNewIconChange(e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                    <label
                      htmlFor="new-icon"
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2 text-sm transition hover:bg-gray-50 h-10"
                    >
                      <UploadCloud className="h-4 w-4 text-[#0E7490]" />
                      Choose Image
                    </label>

                    {newPreviewUrl ? (
                      <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white p-1 shrink-0">
                        <Image
                          src={newPreviewUrl}
                          alt="Icon preview"
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-[#64748B]">No icon</span>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 pt-2">
                  <Button
                    type="button"
                    onClick={handleAddLink}
                    disabled={addLinkMutation.isPending}
                    className="bg-[#0E7490] text-white hover:bg-[#0E7490]/90"
                  >
                    {addLinkMutation.isPending ? 'Adding...' : 'Add Link'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}