const React = require('react');

class Footer extends React.Component {
  docUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl;
    const docsUrl = this.props.config.docsUrl;
    const docsPart = `${docsUrl ? `${docsUrl}/` : ''}`;
    const langPart = `${language ? `${language}/` : ''}`;
    return `${baseUrl}${docsPart}${langPart}${doc}`;
  }

  pageUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl;
    return baseUrl + (language ? `${language}/` : '') + doc;
  }

  render() {
    return (

      <footer>

        <div id="socialLinks">

          <a href="https://twitter.com/voltis_io" target="__blank"><img src="/docs/img/twitter-logo.png"/></a>
          <a href="https://github.com/Superbition/Voltis" target="__blank"><img src="/docs/img/github-logo.png"/></a>

        </div>

        <section className="copyright">{this.props.config.copyright}</section>

        <div id="end_logo"><img src="/docs/img/logo.png"/></div>

      </footer>
    );
  }
}

module.exports = Footer;