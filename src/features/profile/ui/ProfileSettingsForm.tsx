import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type FocusEvent,
  type SubmitEvent,
} from 'react';

import { CreateIcon, KakaoIcon } from '@/shared/assets/icons';
import { ProfileAvatar } from '@/shared/ui/ProfileAvatar';
import { TextField } from '@/shared/ui/TextField';
import { notify } from '@/shared/ui/StatusToast';
import { cn } from '@/shared/utils/cn';

import { validateProfile } from '../lib/validateProfile';
import { readProfilePhoto } from '../lib/readProfilePhoto';
import { useProfileImageUploadMutation } from '../api/useProfileImageUploadMutation';
import type { Profile, ProfileDraft, ProfileErrors, ProfileFieldName } from '../model/profile';

interface ProfileFieldProps extends Omit<ComponentProps<'input'>, 'size'> {
  label: string;
  error?: string;
}

function ProfileField({ label, error, id, ...props }: ProfileFieldProps) {
  return (
    <div className="px-4 py-3">
      <label
        htmlFor={id}
        className="mb-3 block px-1.5 text-sm leading-6 font-light text-neutral-400"
      >
        {label}
      </label>
      <TextField
        {...props}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-12 rounded-sm border-neutral-200 bg-transparent px-4 text-sm leading-6 font-light placeholder:text-stone-300 read-only:text-stone-300 focus-visible:border-gitlog-action"
      />
      {error && (
        <p
          id={`${id}-error`}
          aria-live="polite"
          className="mt-1 px-1.5 text-xs leading-5 font-light text-gitlog-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}

interface ProfileSettingsFormProps {
  profile: Profile;
  editing: boolean;
  pending: boolean;
  onSave: (draft: ProfileDraft) => Promise<boolean>;
}

export function ProfileSettingsForm({
  profile,
  editing,
  pending,
  onSave,
}: ProfileSettingsFormProps) {
  const [values, setValues] = useState<ProfileDraft>({
    email: profile.email,
    name: profile.name,
    birthDate: profile.birthDate,
    nickname: profile.nickname,
    introduction: profile.introduction ?? '',
    avatarUrl: profile.avatarUrl,
    password: '',
    passwordConfirmation: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<ProfileFieldName, boolean>>>({});
  const submitting = useRef(false);
  const photoRequest = useRef(0);
  const photoController = useRef<AbortController | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const upload = useProfileImageUploadMutation();
  const form = useRef<HTMLFormElement>(null);
  const errors: ProfileErrors = Object.fromEntries(
    Object.entries(editing ? validateProfile(values, profile.method) : {}).filter(
      ([name]) => submitted || touched[name as ProfileFieldName],
    ),
  );
  const isEmail = profile.method === 'email';

  useEffect(
    () => () => {
      photoRequest.current++;
      photoController.current?.abort();
    },
    [],
  );

  async function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file || pending) return;
    photoController.current?.abort();
    const request = ++photoRequest.current;
    const controller = new AbortController();
    photoController.current = controller;
    setLoadingPhoto(true);
    setPhotoError('');
    try {
      const preview = await readProfilePhoto(file);
      if (request !== photoRequest.current || controller.signal.aborted) return;
      setValues((previous) => ({ ...previous, avatarUrl: preview }));
      const imageUrl = await upload.mutateAsync({ file, signal: controller.signal });
      if (request === photoRequest.current && !controller.signal.aborted) {
        setValues((previous) => ({ ...previous, avatarUrl: imageUrl }));
      }
    } catch (error) {
      if (request === photoRequest.current && !controller.signal.aborted) {
        setPhotoError(error instanceof Error ? error.message : '사진 업로드에 실패했습니다.');
      }
    } finally {
      if (request === photoRequest.current) {
        setLoadingPhoto(false);
        photoController.current = null;
      }
    }
  }

  function keepPreviousPhoto() {
    photoRequest.current++;
    photoController.current?.abort();
    photoController.current = null;
    upload.reset();
    setLoadingPhoto(false);
    setPhotoError('');
    setValues((previous) => ({ ...previous, avatarUrl: profile.avatarUrl }));
  }

  function change(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.currentTarget;
    setValues((previous) => ({ ...previous, [name]: value }));
    setTouched((previous) => ({ ...previous, [name]: true }));
  }

  function blur(event: FocusEvent<HTMLInputElement>) {
    const { name } = event.currentTarget;
    setTouched((previous) => ({ ...previous, [name]: true }));
  }

  function field(name: ProfileFieldName) {
    return {
      id: `profile-${name}`,
      name,
      value: values[name] ?? '',
      readOnly: !editing,
      onChange: change,
      onBlur: blur,
      disabled: pending,
    };
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || pending || submitting.current) return;
    if (loadingPhoto || photoError) {
      notify.error(loadingPhoto ? '프로필 사진을 업로드하고 있습니다.' : photoError);
      return;
    }
    setSubmitted(true);
    const firstInvalid = Object.keys(validateProfile(values, profile.method))[0];
    if (firstInvalid) {
      notify.error('입력 내용을 확인해주세요.');
      const input = form.current?.elements.namedItem(firstInvalid);
      if (input instanceof HTMLInputElement) input.focus();
      return;
    }
    submitting.current = true;
    try {
      if (await onSave(values)) {
        setValues((previous) => ({ ...previous, password: '', passwordConfirmation: '' }));
      }
    } finally {
      submitting.current = false;
    }
  }

  return (
    <form
      id="profile-settings"
      ref={form}
      noValidate
      onSubmit={submit}
      aria-busy={pending || loadingPhoto}
    >
      <section aria-label="프로필 정보" className="border-b border-neutral-100 bg-neutral-100">
        <div className="mx-auto w-full max-w-[688px] pt-9 pb-3 sm:pt-16 sm:pb-5">
          <div className="px-4 py-3">
            <div className="relative size-16">
              <ProfileAvatar
                src={values.avatarUrl}
                alt={`${values.nickname || '기본'} 프로필 사진`}
                className="size-16"
                loading="eager"
              />
              {editing && (
                <label className="absolute right-0 bottom-0 flex size-6 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-zinc-800 text-white focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gitlog-action">
                  <input
                    type="file"
                    accept="image/*"
                    aria-label="프로필 사진 변경"
                    onChange={selectPhoto}
                    disabled={pending}
                    className="sr-only"
                  />
                  <CreateIcon aria-hidden="true" className="size-4 [&_path]:fill-current" />
                </label>
              )}
            </div>
            {loadingPhoto && (
              <p role="status" className="mt-2 text-xs text-neutral-400">
                프로필 사진을 업로드하고 있습니다.
              </p>
            )}
            {photoError && (
              <p role="alert" className="mt-2 text-xs text-gitlog-danger">
                {photoError}
              </p>
            )}
            {editing && (loadingPhoto || photoError || values.avatarUrl !== profile.avatarUrl) && (
              <button
                type="button"
                disabled={pending}
                onClick={keepPreviousPhoto}
                className="mt-2 text-xs text-gitlog-action underline"
              >
                기존 사진 유지
              </button>
            )}
          </div>
          <div className="flex flex-col gap-3 px-4 py-3">
            <div>
              <label htmlFor="profile-nickname" className="sr-only">
                닉네임
              </label>
              <TextField
                {...field('nickname')}
                aria-invalid={Boolean(errors.nickname)}
                aria-describedby="profile-nickname-hint"
                className={cn(
                  'h-16 rounded-sm border-neutral-200 bg-transparent px-4 text-2xl leading-10 font-medium focus-visible:border-gitlog-action',
                  !editing && 'text-neutral-400',
                )}
              />
              <p
                id="profile-nickname-hint"
                aria-live="polite"
                className={cn(
                  'mt-1 px-1.5 text-xs leading-5 font-light',
                  errors.nickname ? 'text-gitlog-danger' : 'text-stone-300',
                )}
              >
                {errors.nickname ?? '* 영문과 숫자 3~20글자'}
              </p>
            </div>
            <div>
              <label htmlFor="profile-introduction" className="sr-only">
                한 줄 소개
              </label>
              <TextField
                {...field('introduction')}
                aria-invalid={Boolean(errors.introduction)}
                aria-describedby={errors.introduction ? 'profile-introduction-error' : undefined}
                className={cn(
                  'h-12 rounded-sm border-neutral-200 bg-transparent px-4 text-sm leading-6 font-light focus-visible:border-gitlog-action',
                  !editing && 'text-stone-300',
                )}
              />
              {errors.introduction && (
                <p
                  id="profile-introduction-error"
                  aria-live="polite"
                  className="mt-1 px-1.5 text-xs leading-5 font-light text-gitlog-danger"
                >
                  {errors.introduction}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
      <section
        aria-label="계정 정보"
        className="mx-auto w-full max-w-[688px] pt-5 pb-5 sm:pt-8 sm:pb-8"
      >
        {!isEmail && (
          <div className="px-4 py-3">
            <label
              htmlFor="profile-social"
              className="mb-3 block px-1.5 text-sm leading-6 font-light text-neutral-400"
            >
              소셜 로그인
            </label>
            <div className="relative">
              <KakaoIcon
                aria-hidden="true"
                className="pointer-events-none absolute top-4 left-4 size-4 text-kakao-text"
              />
              <TextField
                id="profile-social"
                value="카카오 로그인"
                disabled
                className="h-12 rounded-sm border-neutral-200 pl-10 text-sm font-light"
              />
            </div>
          </div>
        )}
        <ProfileField
          {...field('email')}
          error={errors.email}
          label={isEmail ? '메일' : '이메일'}
          type="email"
          autoComplete="email"
        />
        {isEmail && (
          <>
            <ProfileField
              {...field('password')}
              error={errors.password}
              label="비밀번호"
              type="password"
              placeholder="......"
              autoComplete="new-password"
            />
            <ProfileField
              {...field('passwordConfirmation')}
              error={errors.passwordConfirmation}
              label="비밀번호 확인"
              type="password"
              placeholder="......"
              autoComplete="new-password"
            />
          </>
        )}
        <ProfileField {...field('name')} error={errors.name} label="이름" autoComplete="name" />
        <ProfileField
          {...field('birthDate')}
          error={errors.birthDate}
          label="생년월일"
          placeholder="YYYY - MM - DD"
          autoComplete="bday"
        />
      </section>
    </form>
  );
}
