import { useMutation } from "@tanstack/react-query";
import { updateMyProfile } from "@/features/users/api";
import type { UserProfileContact } from "@/lib/api";

export function useUpdateUserProfile() {
  return useMutation({
    mutationFn: (payload: UserProfileContact) => updateMyProfile(payload),
  });
}
