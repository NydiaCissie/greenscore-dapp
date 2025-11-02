const PILLARS = [
  {
    title: "Full-homomorphic by design",
    description:
      "Every number that reaches the chain is an `euint64`. Aggregations, leaderboard buckets, and reward balances all remain encrypted throughout their lifetime.",
  },
  {
    title: "Deterministic wallet recovery",
    description:
      "We only store connector metadata and decrypt signatures under namespaced keys (`wallet.*`, `fhevm.decryptionSignature.*`). No plaintext behaviour is persisted locally.",
  },
  {
    title: "Mock & relayer parity",
    description:
      "Whether you use `@fhevm/mock-utils` on 31337 or the hosted relayer SDK, the instance boot logic is identical. Deployment artefacts feed both modes via the same ABI generator.",
  },
];

export function SecurityPillars() {
  return (
    <section id="security" className="gs-section">
      <div className="gs-shell">
        <div className="gs-section__header">
          <div>
            <p className="gs-section__eyebrow">Security & privacy</p>
            <h2 className="gs-section__title">Guardrails baked into every layer</h2>
          </div>
          <p className="gs-section__description">
            These practices mirror the contract and front-end code—the cards below reference concrete storage patterns
            and SDK decisions that ship with the repository.
          </p>
        </div>
        <div className="gs-security-grid">
          {PILLARS.map((pillar) => (
            <article key={pillar.title} className="gs-security-card">
              <h3>{pillar.title}</h3>
              <p>{pillar.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


