import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchAvatarSamples, selectAvatarSample, uploadMyAvatar } from "@/features/users/api";
import { queryKeys } from "@/lib/query-keys";

export function useAvatarSamples() {
  return useQuery({
    queryKey: queryKeys.avatarSamples,
    queryFn: fetchAvatarSamples,
  });
}

export function useUploadAvatar() {
  return useMutation({
    mutationFn: (file: File | null) => uploadMyAvatar(file),
  });
}

export function useSelectAvatarSample() {
  return useMutation({
    mutationFn: (url: string) => selectAvatarSample(url),
  });
}
