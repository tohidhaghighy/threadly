import { useMutation } from "@tanstack/react-query";
import { updateMyProfile } from "@/api/users";
import type { UserProfileContact } from "@/lib/api";

export function useUpdateUserProfile() {
  return useMutation({
    mutationFn: (payload: UserProfileContact) => updateMyProfile(payload),
  });
}
