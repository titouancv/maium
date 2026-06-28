import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  mapUserFromDb,
  USER_PROFILE_SELECT,
  type DbUserRaw,
} from "@/lib/mappers/user";
import { getAuthUser, getCurrentUserProfile } from "@/lib/auth/getCurrentUser";
import type { UserData } from "@/types";

export interface ProfileBundle {
  id: string;
  user: UserData;
  isOwner: boolean;
  isAuthenticated: boolean;
  /** Signup timestamp, used to derive the "Nth on maium" join rank. */
  createdAt: string;
}

/**
 * Round-trip 1: the profile row + the viewer's auth/profile (in parallel).
 * Cached per request so the header, body and follow section share one fetch.
 */
export const getProfileBundle = cache(
  async (pseudo: string): Promise<ProfileBundle | null> => {
    const admin = createAdminClient();
    const [profileResult, authUser, currentUser] = await Promise.all([
      admin
        .from("users")
        .select(
          `id, created_at, first_name, last_name, pseudo, dob, gender, location, nationality, bio, profile_photo, ${USER_PROFILE_SELECT}`,
        )
        .eq("pseudo", pseudo)
        .single(),
      getAuthUser(),
      getCurrentUserProfile(),
    ]);

    const raw = profileResult.data as
      | (DbUserRaw & { id: string; created_at: string })
      | null;
    if (!raw) return null;

    return {
      id: raw.id,
      user: mapUserFromDb(raw),
      isOwner: currentUser?.pseudo === pseudo,
      isAuthenticated: !!authUser,
      createdAt: raw.created_at,
    };
  },
);

/**
 * The profile's 1-indexed signup position ("Nth on maium"): how many users
 * had signed up by the time this one did. Depends on the cached
 * {@link getProfileBundle}, so it streams in behind its own Suspense boundary.
 */
export const getProfileRank = cache(
  async (pseudo: string): Promise<number | null> => {
    const bundle = await getProfileBundle(pseudo);
    if (!bundle) return null;

    const admin = createAdminClient();
    const { count } = await admin
      .from("users")
      .select("*", { count: "exact", head: true })
      .lte("created_at", bundle.createdAt);

    return count ?? null;
  },
);

export interface FollowInfo {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

/**
 * Round-trip 2: follow counts + whether the viewer follows this profile.
 * Depends on the profile id from {@link getProfileBundle}, so it streams in
 * separately behind its own Suspense boundary.
 */
export const getFollowInfo = cache(
  async (pseudo: string): Promise<FollowInfo> => {
    const bundle = await getProfileBundle(pseudo);
    if (!bundle) {
      return { followersCount: 0, followingCount: 0, isFollowing: false };
    }

    const authUser = await getAuthUser();
    const admin = createAdminClient();
    const [followers, following, isFollowing] = await Promise.all([
      admin
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("followed_id", bundle.id),
      admin
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", bundle.id),
      authUser && !bundle.isOwner
        ? admin
            .from("user_follows")
            .select("*", { count: "exact", head: true })
            .eq("follower_id", authUser.id)
            .eq("followed_id", bundle.id)
        : Promise.resolve({ count: 0 }),
    ]);

    return {
      followersCount: followers.count ?? 0,
      followingCount: following.count ?? 0,
      isFollowing: !!authUser && !bundle.isOwner && (isFollowing.count ?? 0) > 0,
    };
  },
);
