import React from 'react';
import { Fingerprint } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="footer-logo-icon"><Fingerprint size={20} /></span>
            CIVITAS
          </div>
          <p className="footer-tagline">
            Building a self-governing digital layer where every individual
            owns their digital existence — identity, data, and financial freedom.
          </p>
        </div>

        <div className="footer-section">
          <h3>Platform</h3>
          <ul>
            <li><a href="/wallet">Wallet</a></li>
            <li><a href="/identity">Identity</a></li>
            <li><a href="/governance">Governance</a></li>
            <li><a href="/storage">Storage</a></li>
            <li><a href="/messaging">Messaging</a></li>
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
            <li><a href="https://twitter.com/civitas">Twitter / X</a></li>
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
        <span>© 2026 CIVITAS. Built for Digital Sovereignty.</span>
        <div className="footer-bottom-links">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/docs">Docs</a>
        </div>
      </div>
    </footer>
  );
}
