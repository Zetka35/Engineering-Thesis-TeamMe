import { get, post } from "./http";

export interface PendingReviewTarget {
  teamId: number;
  teamName: string;
  reviewedUserId: number;
  reviewedUsername: string;
  reviewedFullName: string;
  roleLabel: string;
  leftAt?: string | null;
}

export interface CollaborationReview {
  id: number;
  teamId: number;
  teamName: string;
  reviewerUserId: number;
  reviewerUsername: string;
  reviewedUserId: number;
  reviewedUsername: string;
  reviewedFullName: string;
  communicationRating: number;
  reliabilityRating: number;
  collaborationRating: number;
  ownershipRating: number;
  averageRating: number;
  comment?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CollaborationReviewPayload {
  teamId: number;
  reviewedUserId: number;
  communicationRating: number;
  reliabilityRating: number;
  collaborationRating: number;
  ownershipRating: number;
  comment?: string;
}

export function fetchPendingReviews(): Promise<PendingReviewTarget[]> {
  return get<PendingReviewTarget[]>("/api/project-history/reviews/pending");
}

export function fetchGivenReviews(): Promise<CollaborationReview[]> {
  return get<CollaborationReview[]>("/api/project-history/reviews/given");
}

export function fetchReceivedReviews(): Promise<CollaborationReview[]> {
  return get<CollaborationReview[]>("/api/project-history/reviews/received");
}

export function submitCollaborationReview(
  payload: CollaborationReviewPayload
): Promise<CollaborationReview> {
  return post<CollaborationReview>("/api/project-history/reviews", payload);
}