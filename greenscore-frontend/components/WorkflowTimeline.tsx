const STEPS = [
  {
    title: "Connect & silently recover",
    summary:
      "On load we call `eth_accounts` to restore trusted sessions. Wallet metadata lives under `wallet.*` keys so refreshes never break the flow.",
    details:
      "When a user explicitly connects we record the connector id (EIP-6963) and chain id, making subsequent reconnects instant.",
  },
  {
    title: "Encrypt actions with proof",
    summary:
      "Front-end builds encrypted inputs via `instance.createEncryptedInput`, attaches the proof, and forwards them to `submitAction`.",
    details:
      "Quantities stay local: only handles reach the contract, which performs weighted adds and authorisations through FHE.allow.",
  },
  {
    title: "Decrypt insights & claim rewards",
    summary:
      "`ensureDecryptionSignature` manages EIP-712 permits so users can decrypt scores on demand, or redeem incentives with `claimReward`.",
    details:
      "The UI redacts every other participant—the only cleartext shown belongs to the connected wallet.",
  },
];

export function WorkflowTimeline() {
  return (
    <section id="workflow" className="gs-section gs-section--alt">
      <div className="gs-shell">
        <div className="gs-section__header">
          <div>
            <p className="gs-section__eyebrow">Workflow</p>
            <h2 className="gs-section__title">From encrypted input to verifiable outcomes</h2>
          </div>
          <p className="gs-section__description">
            The same flow powers mock mode and the relayer-backed production mode. Swap the RPC and everything keeps
            working thanks to FHEVM parity.
          </p>
        </div>
        <ol className="gs-workflow">
          {STEPS.map((step, index) => (
            <li key={step.title} className="gs-workflow__step">
              <span className="gs-workflow__number">{index + 1}</span>
              <div className="gs-workflow__content">
                <h3>{step.title}</h3>
                <p>{step.summary}</p>
                <p className="gs-workflow__detail">{step.details}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}


