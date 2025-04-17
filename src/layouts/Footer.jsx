const Footer = () => {
  return (
    <footer className="content-footer footer bg-footer-theme">
      <div className="container-xxl d-flex flex-wrap justify-content-between py-2 flex-md-row flex-column">
        <div className="mb-2 mb-md-0">
          ©
          {(new Date().getFullYear())}
          , Copyright by  Muhimbili National Hospital (MNH)
        </div>
        <div className="d-none d-lg-inline-block">
          <a aria-label="go to themeselection license" href="#" className="footer-link me-4" target="_blank" rel='noreferrer' >Service</a>

          <a aria-label="go to themeselection Documentation" href="#"
            target="_blank" rel='noreferrer' className="footer-link me-4">About</a>

          <a aria-label="go to themeselection Support" href="#" target="_blank" rel='noreferrer'
            className="footer-link">Contact</a>
        </div>
      </div>
    </footer>
  );
}
export default Footer;