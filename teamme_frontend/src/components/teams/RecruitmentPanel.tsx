import React, { useMemo, useState } from "react";
import type { RecruitmentRequest, TeamRecruitmentStatus, TeamRoleRequirement } from "../../models/Team";
import type { NetworkUser } from "../../api/user.api";
import TeamRequestsList from "./TeamRequestsList";

type Props = {
  isOwner: boolean;
  isMember: boolean;
  currentUsername?: string | null;
  recruitmentStatus: TeamRecruitmentStatus;
  roleRequirements: TeamRoleRequirement[];
  requests: RecruitmentRequest[];
  inviteCandidates?: NetworkUser[];
  loadingInviteCandidates?: boolean;
  savingApply?: boolean;
  savingInvite?: boolean;
  actingRequestId?: number | null;
  onApply?: (payload: { targetRoleName?: string | null; message?: string }) => void | Promise<void>;
  onInvite?: (payload: {
    username: string;
    targetRoleName?: string | null;
    message?: string;
  }) => void | Promise<void>;
  onRespond?: (
    requestId: number,
    decision: "ACCEPTED" | "REJECTED" | "CANCELLED"
  ) => void | Promise<void>;
};

export default function RecruitmentPanel({
  isOwner,
  isMember,
  currentUsername,
  recruitmentStatus,
  roleRequirements,
  requests,
  inviteCandidates = [],
  loadingInviteCandidates = false,
  savingApply = false,
  savingInvite = false,
  actingRequestId = null,
  onApply,
  onInvite,
  onRespond,
}: Props) {
  const [applyTargetRoleName, setApplyTargetRoleName] = useState("");
  const [applyMessage, setApplyMessage] = useState("");

  const [inviteQuery, setInviteQuery] = useState("");
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteTargetRoleName, setInviteTargetRoleName] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  const visibleRequests = useMemo(() => {
    if (isOwner) return requests;
    return requests.filter(
      (request) =>
        request.username === currentUsername || request.createdByUsername === currentUsername
    );
  }, [isOwner, requests, currentUsername]);

  const filteredInviteCandidates = useMemo(() => {
    const q = inviteQuery.trim().toLowerCase();
    if (!q) return inviteCandidates.slice(0, 8);

    return inviteCandidates
      .filter((candidate) => {
        const haystack = [
          candidate.username,
          candidate.fullName,
          candidate.selectedRole,
          ...(candidate.topSkills ?? []).map((skill) => skill.name),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(q);
      })
      .slice(0, 8);
  }, [inviteCandidates, inviteQuery]);

  const selectedInviteCandidate = useMemo(
    () => inviteCandidates.find((candidate) => candidate.username === inviteUsername) ?? null,
    [inviteCandidates, inviteUsername]
  );

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!onApply) return;

    await onApply({
      targetRoleName: applyTargetRoleName || null,
      message: applyMessage,
    });

    setApplyTargetRoleName("");
    setApplyMessage("");
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!onInvite || !inviteUsername) return;

    await onInvite({
      username: inviteUsername,
      targetRoleName: inviteTargetRoleName || null,
      message: inviteMessage,
    });

    setInviteQuery("");
    setInviteUsername("");
    setInviteTargetRoleName("");
    setInviteMessage("");
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {!isMember && recruitmentStatus === "OPEN" && onApply && (
        <div className="profile-block">
          <div className="profile-block-title">Aplikuj do zespołu</div>

          <form onSubmit={handleApply} style={{ display: "grid", gap: 12 }}>
            <div className="field">
              <label className="field-label"><b>Docelowa rola projektowa</b></label>
              <select
                className="input"
                value={applyTargetRoleName}
                onChange={(e) => setApplyTargetRoleName(e.target.value)}
              >
                <option value="">Dowolna / nie wskazano</option>
                {roleRequirements.map((roleRequirement) => (
                  <option key={roleRequirement.id} value={roleRequirement.projectRoleName}>
                    {roleRequirement.projectRoleName}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label"><b>Wiadomość</b></label>
              <textarea
                className="input"
                rows={4}
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                placeholder="Napisz, dlaczego chcesz dołączyć do tego zespołu."
              />
            </div>

            <div>
              <button className="btn btn-solid" disabled={savingApply}>
                {savingApply ? "Wysyłanie…" : "Wyślij aplikację"}
              </button>
            </div>
          </form>
        </div>
      )}

      {isOwner && onInvite && (
        <div className="profile-block">
          <div className="profile-block-title">Zaproś użytkownika</div>

          <form onSubmit={handleInvite} style={{ display: "grid", gap: 12 }}>
            <div className="field">
              <label className="field-label"><b>Wyszukaj osobę</b></label>
              <input
                className="input"
                value={inviteQuery}
                onChange={(e) => setInviteQuery(e.target.value)}
                placeholder="Szukaj po imieniu, username, roli zespołowej lub skillu"
              />
            </div>

            {loadingInviteCandidates ? (
              <div className="muted">Ładowanie listy kontaktów…</div>
            ) : filteredInviteCandidates.length === 0 ? (
              <div className="muted">Brak osób pasujących do wyszukiwania.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {filteredInviteCandidates.map((candidate) => {
                  const isSelected = inviteUsername === candidate.username;

                  return (
                    <button
                      key={candidate.username}
                      type="button"
                      className="btn btn-ghost"
                      style={{
                        justifyContent: "space-between",
                        border: isSelected ? "2px solid var(--brand-500)" : undefined,
                      }}
                      onClick={() => setInviteUsername(candidate.username)}
                    >
                      <span style={{ textAlign: "left" }}>
                        <b>{candidate.fullName || candidate.username}</b>{" "}
                        <span className="muted">@{candidate.username}</span>
                        {candidate.selectedRole ? (
                          <span className="muted"> · rola zespołowa: {candidate.selectedRole}</span>
                        ) : null}
                      </span>
                      <span className="muted">
                        {(candidate.topSkills ?? []).slice(0, 3).map((skill) => skill.name).join(", ")}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedInviteCandidate && (
              <div className="form-inline-note">
                Wybrano: <b>{selectedInviteCandidate.fullName || selectedInviteCandidate.username}</b>
                {" "}(@{selectedInviteCandidate.username})
                {selectedInviteCandidate.selectedRole
                  ? ` · rola zespołowa: ${selectedInviteCandidate.selectedRole}`
                  : ""}
              </div>
            )}

            <div className="field">
              <label className="field-label"><b>Docelowa rola projektowa</b></label>
              <select
                className="input"
                value={inviteTargetRoleName}
                onChange={(e) => setInviteTargetRoleName(e.target.value)}
                disabled={!inviteUsername}
              >
                <option value="">Dowolna / nie wskazano</option>
                {roleRequirements.map((roleRequirement) => (
                  <option key={roleRequirement.id} value={roleRequirement.projectRoleName}>
                    {roleRequirement.projectRoleName}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label"><b>Wiadomość</b></label>
              <textarea
                className="input"
                rows={4}
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Napisz krótką wiadomość do zapraszanej osoby."
              />
            </div>

            <div>
              <button className="btn btn-solid" disabled={savingInvite || !inviteUsername}>
                {savingInvite ? "Wysyłanie…" : "Wyślij zaproszenie"}
              </button>
            </div>
          </form>
        </div>
      )}

      {(isOwner || visibleRequests.length > 0) && (
        <div className="profile-block">
          <div className="profile-block-title">Zgłoszenia i zaproszenia</div>

          <TeamRequestsList
            requests={visibleRequests}
            currentUsername={currentUsername}
            isOwner={isOwner}
            actingRequestId={actingRequestId}
            onRespond={onRespond}
          />
        </div>
      )}
    </div>
  );
}