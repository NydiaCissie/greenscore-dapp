const HIGHLIGHTS = [
  {
    title: "Deterministic encrypted scoring",
    description:
      "`submitAction` converts every behaviour into weighted `euint64` values and accumulates them with FHE.add, guaranteeing identical scores on any chain.",
    detail: "Handles are automatically authorised for both the caller and the contract to simplify decrypt flows.",
  },
  {
    title: "Bucketed privacy leaderboard",
    description:
      "Aggregated buckets keep the ranking anonymous while `updateLeaderboardSlot` lets operators publish encrypted podium slots without disclosing addresses.",
    detail: "Users decrypt only their own rank through userDecrypt, preserving the rest of the leaderboard as ciphertext.",
  },
  {
    title: "Reward orchestration without leakage",
    description:
      "`seedReward` and `claimReward` operate entirely on ciphertext, so incentives can be allocated or redeemed without exposing balances or thresholds.",
    detail: "Pending rewards remain private until a user authorises a decrypt signature for their wallet.",
  },
];

export function FeatureHighlights() {
  return (
    <section id="features" className="gs-section">
      <div className="gs-shell">
        <div className="gs-section__header">
          <div>
            <p className="gs-section__eyebrow">Why GreenScore</p>
            <h2 className="gs-section__title">Composable primitives for private climate analytics</h2>
          </div>
          <p className="gs-section__description">
            Every highlight below maps to concrete smart-contract functions and front-end flows—no placeholders, just
            FHE-enabled building blocks ready for production.
          </p>
        </div>
        <div className="gs-feature-grid">
          {HIGHLIGHTS.map((feature) => (
            <article key={feature.title} className="gs-feature-card">
              <header>
                <h3>{feature.title}</h3>
              </header>
              <p>{feature.description}</p>
              <p className="gs-feature-card__detail">{feature.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


