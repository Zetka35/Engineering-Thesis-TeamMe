import type { RecruitmentRequest } from "../models/Team";

export function isActionableRecruitmentRequest(
  request: RecruitmentRequest,
  currentUsername?: string | null
) {
  if (!currentUsername) return false;
  if (request.status !== "PENDING") return false;

  const isApplicationToMyTeam =
    request.requestType === "APPLICATION" &&
    request.createdByUsername !== currentUsername;

  const isInvitationForMe =
    request.requestType === "INVITATION" &&
    request.username === currentUsername;

  return isApplicationToMyTeam || isInvitationForMe;
}

export function countActionableRecruitmentRequests(
  requests: RecruitmentRequest[],
  currentUsername?: string | null
) {
  return requests.filter((request) =>
    isActionableRecruitmentRequest(request, currentUsername)
  ).length;
}