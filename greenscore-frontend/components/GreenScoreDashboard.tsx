"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { useGreenScoreRuntime } from "@/hooks/useGreenScoreRuntime";
import { actionDefinitions, type GreenActionId } from "@/lib/actions";
import { formatQuantity, formatScore, truncateAddress, truncateHash } from "@/utils/format";

type FormState = {
  actionId: GreenActionId;
  quantity: number;
  description: string;
};

const INITIAL_FORM: FormState = {
  actionId: actionDefinitions[0].id,
  quantity: 1,
  description: "",
};

// Reusable section card component for dashboard layout
function SectionCard({
  title,
  subtitle,
  children,
  id,
  tone = "default",
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  id?: string;
  tone?: "default" | "accent" | "muted";
  className?: string;
}) {
  return (
    <section id={id} className={clsx("gs-card", tone !== "default" && `gs-card--${tone}`, className)}>
      <header className="gs-card__header">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </header>
      <div className="gs-card__content">{children}</div>
    </section>
  );
}

export function GreenScoreDashboard() {
  const runtime = useGreenScoreRuntime();
  const wallet = runtime.wallet;
  const contractAddress = runtime.contract.address;
  const chainName = runtime.contract.chainName;
  const data = runtime.data;
  const actions = runtime.actions;
  const fhevmStatus = runtime.fhevm.status;
  const isReady = runtime.ready;
  const fhevmError = runtime.fhevm.error;

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const selectedAction = useMemo(
    () => actionDefinitions.find((item) => item.id === form.actionId) ?? actionDefinitions[0],
    [form.actionId],
  );

  const scoreValue = formatScore(data.decrypted?.score);
  const pendingValue = formatScore(data.decrypted?.pending, "0");

  if (!contractAddress) {
    return (
      <section className="gs-section">
        <div className="gs-shell">
          <SectionCard
            title="Contract unavailable on current chain"
            subtitle="Deploy the GreenScore contract to your current network and re-run npm run gen:abi before interacting."
            tone="accent"
          >
            <p>
              Detected chain: <strong>{wallet.chainId ?? "unknown"}</strong>. ABI entries are produced from
              `fhevm-hardhat-template/deployments`, so make sure the artefact is present for your target chain before
              continuing.
            </p>
          </SectionCard>
        </div>
      </section>
    );
  }

  return (
    <section id="dashboard" className="gs-section">
      <div className="gs-shell">
        <div className="gs-section__header">
          <div>
            <p className="gs-section__eyebrow">Live encrypted data</p>
            <h2 className="gs-section__title">Operate with private climate actions in real time</h2>
          </div>
          <p className="gs-section__description">
            Submitted behaviours become encrypted handles instantly. The dashboard below demonstrates the exact
            contract/state interactions shipped with the repository—nothing staged or simulated.
          </p>
        </div>
        <div className="gs-dashboard">
          <div className="gs-dashboard__primary">
            <SectionCard
              id="upload"
              tone="accent"
              title="Submit a new encrypted action"
              subtitle="Quantify a low-carbon behaviour, encrypt it with the FHE instance, and push it on-chain with proof."
            >
              <form
                className="gs-form"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setErrorMessage(undefined);
                  try {
                    await runtime.actions.submitAction({
                      actionId: form.actionId,
                      quantity: form.quantity,
                      description: form.description,
                    });
                    runtime.data.refetch();
                  } catch (error) {
                    setErrorMessage((error as Error).message ?? String(error));
                  }
                }}
              >
                <div className="gs-form__row">
                  <label htmlFor="green-action">Action</label>
                  <select
                    id="green-action"
                    value={form.actionId}
                    onChange={(event) => setForm((prev) => ({ ...prev, actionId: event.target.value as GreenActionId }))}
                  >
                    {actionDefinitions.map((action) => (
                      <option key={action.id} value={action.id}>
                        {action.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="gs-form__row">
                  <label htmlFor="green-quantity">Quantity ({selectedAction.unit})</label>
                  <input
                    id="green-quantity"
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={(event) => setForm((prev) => ({ ...prev, quantity: Number(event.target.value) }))}
                    required
                  />
                </div>
                <div className="gs-form__row">
                  <label htmlFor="green-description">Description (off-chain)</label>
                  <textarea
                    id="green-description"
                    value={form.description}
                    placeholder="Optional reference for yourself"
                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                    maxLength={160}
                  />
                </div>
                <div className="gs-form__meta">
                  <div>
                    <span className="gs-pill gs-pill--surface">Weight ×{selectedAction.weight}</span>
                    <span className="gs-form__hint">
                      Estimated points: {selectedAction.weight * Math.max(form.quantity, 1)}
                    </span>
                  </div>
                  <button
                    className="gs-cta gs-cta--primary"
                    type="submit"
                    disabled={actions.isSubmitting || wallet.status !== "connected" || !isReady}
                  >
                    {actions.isSubmitting ? "Encrypting…" : isReady ? "Publish encrypted entry" : "Preparing FHEVM…"}
                  </button>
                </div>
                {errorMessage && <p className="gs-form__error">{errorMessage}</p>}
                {wallet.status !== "connected" && (
                  <p className="gs-form__hint">Connect a wallet to submit encrypted climate actions.</p>
                )}
                {wallet.status === "connected" && !isReady && (
                  <p className="gs-form__hint">Waiting for FHEVM instance（{fhevmStatus}）完成初始化后即可提交。</p>
                )}
                {wallet.status === "connected" && fhevmStatus === "error" && (
                  <p className="gs-form__error">
                    FHEVM 初始化失败：{fhevmError ?? "请确认本地 FHE Hardhat 节点已运行或配置了 Relayer SDK"}
                  </p>
                )}
              </form>
            </SectionCard>

            <SectionCard
              tone="muted"
              title="Private score summary"
              subtitle="Only the connected wallet can decrypt the values below."
            >
              <div className="gs-summary">
                <div className="gs-summary__item">
                  <span className="gs-summary__label">Your encrypted score</span>
                  <span className="gs-summary__value">{scoreValue}</span>
                </div>
                <div className="gs-summary__item">
                  <span className="gs-summary__label">Recorded actions</span>
                  <span className="gs-summary__value">{formatScore(data.decrypted?.actions)}</span>
                  <span className="gs-summary__caption">Plain counter: {formatQuantity(data.plainActionCount)}</span>
                </div>
                <div className="gs-summary__item">
                  <span className="gs-summary__label">Pending eco rewards</span>
                  <span className="gs-summary__value">{pendingValue}</span>
                  <button
                    type="button"
                    className="gs-pill"
                    disabled={
                      actions.isClaiming ||
                      !isReady ||
                      !data.decrypted?.pending ||
                      data.decrypted.pending === 0n
                    }
                    onClick={async () => {
                      setErrorMessage(undefined);
                      try {
                        await actions.claimReward(data.decrypted?.pending ?? 0n);
                        data.refetch();
                      } catch (error) {
                        setErrorMessage((error as Error).message ?? String(error));
                      }
                    }}
                  >
                    {actions.isClaiming ? "Claiming…" : "Claim encrypted rewards"}
                  </button>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="gs-dashboard__secondary">
            <SectionCard
              id="scoreboard"
              title="Privacy leaderboard"
              subtitle="Buckets keep scores meaningful while individual identities stay redacted."
            >
              <div className="gs-leaderboard">
                {actionDefinitions.map((definition, index) => {
                  const total = data.decrypted?.buckets?.[definition.bucket];
                  return (
                    <div key={definition.id} className="gs-leaderboard__row">
                      <div className="gs-leaderboard__rank">#{index + 1}</div>
                      <div className="gs-leaderboard__info">
                        <strong>{definition.label}</strong>
                        <p>{definition.description}</p>
                      </div>
                      <div className="gs-leaderboard__value">{formatScore(total)}</div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard
              id="rewards"
              title="Reward unlocks"
              subtitle="All balances stay encrypted until you approve a decrypt signature."
            >
              <div className="gs-rewards">
                <div className="gs-rewards__item">
                  <span className="gs-rewards__label">Latest transaction</span>
                  <span className="gs-rewards__value">{actions.lastTxHash ? truncateHash(actions.lastTxHash) : "—"}</span>
                </div>
                <div className="gs-rewards__item">
                  <span className="gs-rewards__label">Contract address</span>
                  <span className="gs-rewards__value">{truncateAddress(contractAddress)}</span>
                </div>
                <div className="gs-rewards__item">
                  <span className="gs-rewards__label">Network</span>
                  <span className="gs-rewards__value">{chainName ?? wallet.chainId ?? "Unknown"}</span>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              tone="muted"
              title="Global encrypted stats"
              subtitle="Aggregates are decrypted on demand in the browser—no server-side shortcuts."
            >
              <div className="gs-stats-grid">
                <div className="gs-stats-card">
                  <span className="gs-stats-card__label">Network total score</span>
                  <span className="gs-stats-card__value">{formatScore(data.decrypted?.globalScore)}</span>
                </div>
                <div className="gs-stats-card">
                  <span className="gs-stats-card__label">Encrypted action proofs</span>
                  <span className="gs-stats-card__value">{formatScore(data.decrypted?.globalActions)}</span>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </section>
  );
}

