import React, { useMemo, useState } from "react";
import type { RecruitmentRequest, TeamRecruitmentStatus, TeamRoleRequirement } from "../../models/Team";
import TeamRequestsList from "./TeamRequestsList";

type Props = {
  isOwner: boolean;
  isMember: boolean;
  currentUsername?: string | null;
  recruitmentStatus: TeamRecruitmentStatus;
  roleRequirements: TeamRoleRequirement[];
  requests: RecruitmentRequest[];
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
  savingApply = false,
  savingInvite = false,
  actingRequestId = null,
  onApply,
  onInvite,
  onRespond,
}: Props) {
  const [applyTargetRoleName, setApplyTargetRoleName] = useState("");
  const [applyMessage, setApplyMessage] = useState("");

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
    if (!onInvite) return;

    await onInvite({
      username: inviteUsername,
      targetRoleName: inviteTargetRoleName || null,
      message: inviteMessage,
    });

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
            <div>
              <label><b>Docelowa rola</b></label>
              <select
                className="input"
                value={applyTargetRoleName}
                onChange={(e) => setApplyTargetRoleName(e.target.value)}
              >
                <option value="">Dowolna / nie wskazano</option>
                {roleRequirements.map((roleRequirement) => (
                  <option key={roleRequirement.id} value={roleRequirement.roleName}>
                    {roleRequirement.roleName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label><b>Wiadomość</b></label>
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
            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              }}
            >
              <div>
                <label><b>Username użytkownika</b></label>
                <input
                  className="input"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  placeholder="Np. anna.front"
                  required
                />
              </div>

              <div>
                <label><b>Rola docelowa</b></label>
                <select
                  className="input"
                  value={inviteTargetRoleName}
                  onChange={(e) => setInviteTargetRoleName(e.target.value)}
                >
                  <option value="">Dowolna / nie wskazano</option>
                  {roleRequirements.map((roleRequirement) => (
                    <option key={roleRequirement.id} value={roleRequirement.roleName}>
                      {roleRequirement.roleName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label><b>Wiadomość</b></label>
              <textarea
                className="input"
                rows={4}
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Napisz krótką wiadomość do zapraszanej osoby."
              />
            </div>

            <div>
              <button className="btn btn-solid" disabled={savingInvite}>
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