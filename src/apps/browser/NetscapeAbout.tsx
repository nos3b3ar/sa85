type NetscapeAboutProps = {
  onLicense: () => void;
};

export function NetscapeAbout({ onLicense }: NetscapeAboutProps) {
  return (
    <div className="ns-about">
      <h1>
        Netscape<span className="ns-about-reg">®</span> Navigator <span className="ns-about-version">4.85</span>
      </h1>
      <div className="ns-about-body">
        <div className="ns-about-brand">
          <img src="/img/netscape/about-logo.png" width={98} height={97} alt="" draggable={false} />
          <img src="/img/netscape/about-wordmark.png" width={174} height={20} alt="NETSCAPE" draggable={false} />
        </div>
        <div className="ns-about-copy">
          <p>Copyright © 1985-2026 Stefan Andernach, All rights reserved.</p>
          <p>
            This software is part of sa85 and subject to the notices set forth in the{' '}
            <button type="button" className="ns-license" onClick={onLicense}>license</button>.
            Please read them before using this software.
          </p>
          <p className="ns-about-small">
            sa85 is a private fan project and is not affiliated with Netscape.
            Netscape, Netscape Navigator and the Netscape logos are trademarks
            of their respective owners. Other product and brand names are
            trademarks of their respective owners.
          </p>
        </div>
      </div>
    </div>
  );
}
