/**
 * Shared AppZ Makers popup body — same markup/classes as the storefront footer popover.
 */
const APPZ_WEBSITE = 'https://appzmake.com';

const AppzDevelopedPopupPanel = ({ onClose, className = '' }) => (
  <a
    className={`footer-appz-popover-link${className ? ` ${className}` : ''}`}
    href={APPZ_WEBSITE}
    target="_blank"
    rel="noopener noreferrer"
    onClick={() => onClose?.()}
  >
    <img
      src="/appz-makers-logo.png"
      alt="AppZ Makers logo"
      className="footer-appz-logo"
      width="150"
      loading="lazy"
      decoding="async"
    />
    <span className="footer-appz-title">Developed by the AppZ Trinity Team</span>
    <span className="footer-appz-url">{APPZ_WEBSITE}</span>
    <span className="footer-appz-note">Click here to visit our official website.</span>
  </a>
);

export default AppzDevelopedPopupPanel;
