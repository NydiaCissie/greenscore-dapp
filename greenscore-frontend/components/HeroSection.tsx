"use client";

import { useGreenScoreRuntime } from "@/hooks/useGreenScoreRuntime";
import { formatScore } from "@/utils/format";

export function HeroSection() {
  const runtime = useGreenScoreRuntime();
  const wallet = runtime.wallet;
  const primaryCta = wallet.status === "connected" ? "Submit Green Actions" : "Connect Wallet";
  const primaryHref = wallet.status === "connected" ? "#upload" : undefined;

  const personalScore = formatScore(runtime.data.decrypted?.score);
  const globalScore = formatScore(runtime.data.decrypted?.globalScore);
  const globalProofs = formatScore(runtime.data.decrypted?.globalActions);

  const fhevmStatus = runtime.ready ? "FHEVM ready" : `FHEVM ${runtime.fhevm.status}`;
  const walletStatus = wallet.status === "connected" ? "Wallet connected" : "Wallet disconnected";

  return (
    <section id="overview" className="gs-section gs-section--hero">
      <div className="gs-shell">
        <div className="gs-hero">
          <div className="gs-hero__content">
            <div className="gs-hero__badge">Privacy-preserving climate intelligence</div>
            <h1 className="gs-hero__title">
              Encrypt your climate actions,
              <span className="gs-hero__accent"> orchestrate verifiable green scores.</span>
            </h1>
            <p className="gs-hero__subtitle">
              GreenScore keeps every behaviour encrypted from submission to aggregation. The FHEVM contract weights
              contributions, updates private leaderboards, and exposes decrypt handles only to authorised users.
            </p>
            <div className="gs-hero__actions">
              <a
                className="gs-cta gs-cta--primary"
                href={primaryHref ?? "#"}
                onClick={(event) => {
                  if (!primaryHref) {
                    event.preventDefault();
                    void wallet.connect();
                  }
                }}
              >
                {primaryCta}
              </a>
              <a className="gs-cta gs-cta--ghost" href="#workflow">
                See the encrypted workflow
              </a>
            </div>
            <div className="gs-hero__status">
              <span className="gs-status-pill">{walletStatus}</span>
              <span className="gs-status-pill">{fhevmStatus}</span>
            </div>
          </div>
          <div className="gs-hero__metrics" aria-label="Live encrypted indicators">
            <div className="gs-metric-card">
              <span className="gs-metric__label">My encrypted score</span>
              <span className="gs-metric__value" data-metric="personal-score">
                {personalScore}
              </span>
              <span className="gs-metric__hint">Only decrypted locally once you authorise the contract</span>
            </div>
            <div className="gs-metric-card">
              <span className="gs-metric__label">Network cumulative score</span>
              <span className="gs-metric__value" data-metric="global-score">
                {globalScore}
              </span>
              <span className="gs-metric__hint">Aggregated on-chain via FHE.add without exposing raw data</span>
            </div>
            <div className="gs-metric-card">
              <span className="gs-metric__label">Encrypted action proofs</span>
              <span className="gs-metric__value" data-metric="proofs">
                {globalProofs}
              </span>
              <span className="gs-metric__hint">Each submission carries an input proof to guarantee integrity</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

