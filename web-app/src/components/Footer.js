import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>CIVITAS</h3>
          <p style={{ color: '#8b8b8b', fontSize: '14px', lineHeight: '1.6' }}>
            Building a self-governing digital layer where every individual 
            owns their digital existence.
          </p>
        </div>
        
        <div className="footer-section">
          <h3>Platform</h3>
          <ul>
            <li><a href="/wallet">Wallet</a></li>
            <li><a href="/identity">Identity</a></li>
            <li><a href="/governance">Governance</a></li>
            <li><a href="/storage">Storage</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Resources</h3>
          <ul>
            <li><a href="/docs">Documentation</a></li>
            <li><a href="https://github.com/civitas">GitHub</a></li>
            <li><a href="/whitepaper">Whitepaper</a></li>
            <li><a href="/roadmap">Roadmap</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Community</h3>
          <ul>
            <li><a href="https://discord.gg/civitas">Discord</a></li>
            <li><a href="https://twitter.com/civitas">Twitter</a></li>
            <li><a href="https://forum.civitas.network">Forum</a></li>
            <li><a href="/blog">Blog</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Legal</h3>
          <ul>
            <li><a href="/privacy">Privacy Policy</a></li>
            <li><a href="/terms">Terms of Service</a></li>
            <li><a href="/licenses">Open Source</a></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© 2026 CIVITAS. All rights reserved. Built with ❤️ for Digital Sovereignty.</p>
      </div>
    </footer>
  );
}
