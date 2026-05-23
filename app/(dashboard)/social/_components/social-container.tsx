'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, UploadCloud } from 'lucide-react';
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

type SocialLinkState = {
  id: string;
  link: string;
  iconUrl: string | null;
  iconPublicId?: string;
  iconFile: File | null;
  previewUrl: string | null;
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

  const [socialLinks, setSocialLinks] = useState<SocialLinkState[]>([]);

  const apiBase = useMemo(getApiBase, []);
  const socialEndpoint = useMemo(
    () => (apiBase ? `${apiBase}/socialpartership/${SOCIAL_ID}` : `/socialpartership/${SOCIAL_ID}`),
    [apiBase]
  );

  const socialQuery = useQuery({
    queryKey: ['social-data', token],
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await fetch(socialEndpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || hasExplicitFailure(payload)) {
        throw new Error(getApiMessage(payload) ?? 'Failed to load social data.');
      }

      return payload.data as SocialData;
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

      if (socialQuery.data.socialLink && Array.isArray(socialQuery.data.socialLink)) {
        const initialLinks: SocialLinkState[] = socialQuery.data.socialLink.map((sl) => ({
          id: sl._id || Math.random().toString(36).substring(7),
          link: sl.link || '',
          iconUrl: sl.icon || null,
          iconPublicId: sl.iconPublicId,
          iconFile: null,
          previewUrl: null,
        }));
        setSocialLinks(initialLinks);
      } else {
        setSocialLinks([]);
      }
    }
  }, [socialQuery.data]);

  useEffect(() => {
    return () => {
      socialLinks.forEach(link => {
        if (link.previewUrl && link.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(link.previewUrl);
        }
      });
    };
  }, [socialLinks]);

  const saveMutation = useMutation({
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
        throw new Error(getApiMessage(result) ?? 'Failed to update social data.');
      }

      return result;
    },
    onSuccess: () => {
      toast.success('Social data updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['social-data', token] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save social data.');
    },
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSocialLink = () => {
    setSocialLinks(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        link: '',
        iconUrl: null,
        iconFile: null,
        previewUrl: null
      }
    ]);
  };

  const handleRemoveSocialLink = (id: string) => {
    setSocialLinks(prev => {
      const linkToRemove = prev.find(l => l.id === id);
      if (linkToRemove?.previewUrl && linkToRemove.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(linkToRemove.previewUrl);
      }
      return prev.filter(l => l.id !== id);
    });
  };

  const handleSocialLinkChange = (id: string, value: string) => {
    setSocialLinks(prev => prev.map(l => l.id === id ? { ...l, link: value } : l));
  };

  const handleSocialLinkFileChange = (id: string, file: File | null) => {
    setSocialLinks(prev => prev.map(l => {
      if (l.id === id) {
        if (l.previewUrl && l.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(l.previewUrl);
        }
        return {
          ...l,
          iconFile: file,
          previewUrl: file ? URL.createObjectURL(file) : null
        };
      }
      return l;
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
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

    // Depending on backend implementation, social links arrays can be passed in different ways:
    // 1. JSON stringified:
    // payload.append('socialLinkData', JSON.stringify(socialLinks.map(l => ({ link: l.link, icon: l.iconUrl }))));
    // 2. Form array format:
    socialLinks.forEach((sl, index) => {
      payload.append(`socialLink[${index}][link]`, sl.link);
      if (sl.iconUrl && !sl.iconFile) {
        payload.append(`socialLink[${index}][icon]`, sl.iconUrl);
        if (sl.iconPublicId) {
          payload.append(`socialLink[${index}][iconPublicId]`, sl.iconPublicId);
        }
      }
      if (sl.iconFile) {
        // Use [icon] if multer handles nested arrays, or custom logic per backend
        payload.append(`socialLink[${index}][icon]`, sl.iconFile);
      }
    });

    saveMutation.mutate(payload);
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

  return (
    <div className="space-y-6 pb-10">
      <div className="w-full">
        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-[#0F172A]">Social Information</h2>
            <p className="text-sm text-[#64748B] mt-1">Manage the social and partnership information displayed on the website.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#0F172A]">Social Links</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddSocialLink}
                  className="h-9 gap-2 border-[#E2E8F0] text-[#0F172A]"
                >
                  <Plus className="h-4 w-4" />
                  Add Link
                </Button>
              </div>

              {socialLinks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] py-8 text-center text-sm text-[#64748B]">
                  No social links added yet. Click &ldquo;Add Link&ldquo; to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {socialLinks.map((link) => {
                    const previewImage = link.previewUrl || link.iconUrl;
                    const safePreviewImage = isValidImageSrc(previewImage) ? previewImage : '';
                    const fileInputId = `social-icon-${link.id}`;

                    return (
                      <div key={link.id} className="relative flex items-start gap-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                        <div className="flex-1 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor={`link-${link.id}`}>Social Media Link</Label>
                            <Input
                              id={`link-${link.id}`}
                              value={link.link}
                              onChange={(e) => handleSocialLinkChange(link.id, e.target.value)}
                              placeholder="https://facebook.com/..."
                              className="h-10 bg-white"
                            />
                          </div>

                          <div className="space-y-3">
                            <Label>Icon Image</Label>
                            <div className="flex items-center gap-4">
                              <input
                                id={fileInputId}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleSocialLinkFileChange(link.id, e.target.files?.[0] ?? null)}
                                className="hidden"
                              />
                              <label
                                htmlFor={fileInputId}
                                className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#CBD5E1] bg-white px-3 py-2 text-sm transition hover:bg-gray-50"
                              >
                                <UploadCloud className="h-4 w-4 text-[#0E7490]" />
                                Choose Image
                              </label>

                              {safePreviewImage ? (
                                <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white p-1">
                                  <Image
                                    src={safePreviewImage}
                                    alt="Icon preview"
                                    fill
                                    className="object-contain p-1"
                                  />
                                </div>
                              ) : (
                                <span className="text-xs text-[#64748B]">No icon selected</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleRemoveSocialLink(link.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove Link</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="h-11 bg-[#FBFF26] px-8 font-semibold text-[#2D3D4D] hover:bg-[#FBFF26]/95 transition-colors"
              >
                {saveMutation.isPending ? 'Saving...' : 'Update Social Information'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}