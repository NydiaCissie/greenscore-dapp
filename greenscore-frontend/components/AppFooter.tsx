export function AppFooter() {
  return (
    <footer className="gs-footer">
      <div className="gs-shell gs-footer__inner">
        <div>
          <span className="gs-footer__title">GreenScore</span>
          <p className="gs-footer__subtitle">Built with the Zama FHEVM stack for privacy-first climate analytics.</p>
        </div>
        <div className="gs-footer__links">
          <a href="https://docs.zama.ai/fhevm" target="_blank" rel="noreferrer">
            FHEVM Docs
          </a>
          <a href="https://github.com/zama-ai/fhevm-hardhat-template" target="_blank" rel="noreferrer">
            Hardhat template
          </a>
          <a href="#overview">Back to top</a>
        </div>
      </div>
    </footer>
  );
}


