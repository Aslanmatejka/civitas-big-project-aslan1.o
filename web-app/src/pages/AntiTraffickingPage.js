import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { antiTraffickingApi } from '../services/api';
import './AntiTraffickingPage.css';

const REPORT_TYPES = [
  { value: 'labour',   label: '🏭 Labour Trafficking',   desc: 'Forced labour, domestic servitude, debt bondage' },
  { value: 'sex',      label: '⚠️ Sex Trafficking',      desc: 'Commercial sexual exploitation under force/fraud/coercion' },
  { value: 'child',    label: '🛡️ Child Trafficking',    desc: 'Any trafficking involving a minor' },
  { value: 'other',    label: '📋 Other / Unsure',        desc: 'Suspected trafficking — unsure of type' },
];

const URGENCY_LEVELS = [
  { value: 'immediate', label: '🔴 Immediate Danger',  desc: 'Someone is in danger right now' },
  { value: 'high',      label: '🟠 High',               desc: 'Active situation, needs prompt attention' },
  { value: 'medium',    label: '🟡 Medium',             desc: 'Suspected ongoing situation' },
  { value: 'low',       label: '🟢 Low / Historical',   desc: 'Past event or general suspicion' },
];

export default function AntiTraffickingPage() {
  const { wallet, isConnected } = useApp();
  const [tab, setTab] = useState('report');

  // Report form state
  const [reportType,          setReportType]          = useState('');
  const [description,         setDescription]         = useState('');
  const [location,            setLocation]            = useState('');
  const [urgency,             setUrgency]             = useState('medium');
  const [victimCount,         setVictimCount]         = useState('');
  const [suspectDescription,  setSuspectDescription]  = useState('');
  const [anonymous,           setAnonymous]           = useState(true);
  const [submitting,          setSubmitting]          = useState(false);
  const [submitResult,        setSubmitResult]        = useState(null);

  // Data state
  const [resources,    setResources]    = useState([]);
  const [warningSigns, setWarningSigns] = useState([]);
  const [alerts,       setAlerts]       = useState([]);
  const [stats,        setStats]        = useState(null);
  const [myReports,    setMyReports]    = useState([]);
  const [loading,      setLoading]      = useState(false);

  // Alert form
  const [alertRegion,   setAlertRegion]   = useState('');
  const [alertMessage,  setAlertMessage]  = useState('');
  const [alertSeverity, setAlertSeverity] = useState('medium');
  const [postingAlert,  setPostingAlert]  = useState(false);
  const [alertResult,   setAlertResult]   = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (tab === 'my-reports' && wallet?.address) loadMyReports();
  }, [tab, wallet?.address]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resData, signsData, alertsData, statsData] = await Promise.all([
        antiTraffickingApi.getResources(),
        antiTraffickingApi.getWarningSigns(),
        antiTraffickingApi.getAlerts(),
        antiTraffickingApi.getStats(),
      ]);
      setResources(resData.data?.resources || []);
      setWarningSigns(signsData.data?.warningSigns || []);
      setAlerts(alertsData.data?.alerts || []);
      setStats(statsData.data?.stats || null);
    } catch (e) {
      console.error('Error loading anti-trafficking data:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadMyReports = async () => {
    try {
      const data = await antiTraffickingApi.getMyReports(wallet.address);
      setMyReports(data.data?.reports || []);
    } catch (e) {
      console.error('Error loading my reports:', e);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportType || !description) return;
    if (urgency === 'immediate') {
      const confirmed = window.confirm(
        '🚨 If someone is in IMMEDIATE danger, please call emergency services (911 / 112) FIRST.\n\nDo you still want to submit this digital report as well?'
      );
      if (!confirmed) return;
    }
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await antiTraffickingApi.submitReport({
        reportType, description, location, urgency,
        victimCount: victimCount || undefined,
        suspectDescription: suspectDescription || undefined,
        anonymous,
        walletAddress: !anonymous && wallet?.address ? wallet.address : undefined,
      });
      setSubmitResult({ success: true, data: res.data });
      // Clear form
      setReportType(''); setDescription(''); setLocation('');
      setUrgency('medium'); setVictimCount(''); setSuspectDescription('');
      loadData();
    } catch (err) {
      setSubmitResult({ success: false, message: err.response?.data?.error || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostAlert = async (e) => {
    e.preventDefault();
    if (!isConnected) return alert('Connect your wallet to post community alerts.');
    setPostingAlert(true);
    setAlertResult(null);
    try {
      await antiTraffickingApi.postAlert({
        region: alertRegion, message: alertMessage, severity: alertSeverity,
        walletAddress: wallet.address,
      });
      setAlertResult({ success: true });
      setAlertRegion(''); setAlertMessage(''); setAlertSeverity('medium');
      const fresh = await antiTraffickingApi.getAlerts();
      setAlerts(fresh.data?.alerts || []);
    } catch (err) {
      setAlertResult({ success: false, message: err.response?.data?.error || err.message });
    } finally {
      setPostingAlert(false);
    }
  };

  const severityColor = (s) => ({ high: 'var(--red)', medium: 'var(--amber)', low: 'var(--green)' }[s] || 'var(--text-3)');
  const urgencyColor  = (u) => ({ immediate: 'var(--red)', high: 'var(--amber)', medium: 'var(--cyan)', low: 'var(--green)' }[u] || 'var(--text-3)');
  const statusLabel   = (s) => ({ received: '📥 Received', reviewed: '🔍 Under Review', escalated: '🚨 Escalated', closed: '✅ Closed' }[s] || s);

  const TABS = [
    { id: 'report',       label: '📝 Report',           icon: '📝' },
    { id: 'resources',    label: '📞 Resources',         icon: '📞' },
    { id: 'warning-signs',label: '⚠️ Warning Signs',    icon: '⚠️' },
    { id: 'alerts',       label: '🚨 Community Alerts',  icon: '🚨' },
    ...(isConnected ? [{ id: 'my-reports', label: '🗂️ My Reports', icon: '🗂️' }] : []),
  ];

  return (
    <div className="at-page">
      {/* Hero */}
      <div className="at-hero">
        <div className="at-hero-badge">Human Rights Protection</div>
        <h1 className="at-hero-title">Fight Human Trafficking</h1>
        <p className="at-hero-sub">
          Report suspicious activity anonymously, access emergency resources, and help protect vulnerable people in your community.
        </p>
        {stats && (
          <div className="at-hero-stats">
            <div className="at-hero-stat"><span>{stats.total || 0}</span><label>Reports Filed</label></div>
            <div className="at-hero-stat"><span>{stats.byStatus?.escalated || 0}</span><label>Escalated</label></div>
            <div className="at-hero-stat"><span>24/7</span><label>Hotlines Active</label></div>
          </div>
        )}
      </div>

      {/* Emergency Banner */}
      <div className="at-emergency-banner">
        <span className="at-emergency-icon">🆘</span>
        <div className="at-emergency-text">
          <strong>IMMEDIATE DANGER?</strong> Call <strong>911</strong> (USA) · <strong>112</strong> (EU) · <strong>999</strong> (UK) or the National Hotline: <strong>1-888-373-7888</strong>
        </div>
      </div>

      {/* Tabs */}
      <div className="at-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`at-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="at-body">

        {/* ── REPORT TAB ───────────────────────────────────────────── */}
        {tab === 'report' && (
          <div className="at-report-section">
            {submitResult?.success ? (
              <div className="at-success-card">
                <div className="at-success-icon">✅</div>
                <h2>Report Submitted</h2>
                <p>{submitResult.data.message}</p>
                <div className="at-ref-box">
                  <label>Reference Code</label>
                  <strong>{submitResult.data.referenceCode}</strong>
                </div>
                <div className="at-ref-box">
                  <label>Integrity Hash (blockchain-ready)</label>
                  <code>{submitResult.data.contentHash}</code>
                </div>
                {submitResult.data.urgency === 'immediate' && (
                  <div className="at-urgent-notice">
                    🚨 {submitResult.data.nextSteps}
                  </div>
                )}
                <button className="at-btn at-btn-primary" onClick={() => setSubmitResult(null)}>
                  Submit Another Report
                </button>
              </div>
            ) : (
              <form className="at-report-form" onSubmit={handleSubmitReport}>
                <div className="at-form-header">
                  <h2>Submit Anonymous Report</h2>
                  <p>All reports are anonymous by default. Your identity is never required. For immediate danger — call emergency services first.</p>
                </div>

                {/* Report Type */}
                <div className="at-field-group">
                  <label>Type of Trafficking <span className="at-required">*</span></label>
                  <div className="at-type-grid">
                    {REPORT_TYPES.map(t => (
                      <button
                        key={t.value}
                        type="button"
                        className={`at-type-card ${reportType === t.value ? 'selected' : ''}`}
                        onClick={() => setReportType(t.value)}
                      >
                        <span className="at-type-label">{t.label}</span>
                        <span className="at-type-desc">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Urgency */}
                <div className="at-field-group">
                  <label>Urgency Level <span className="at-required">*</span></label>
                  <div className="at-urgency-row">
                    {URGENCY_LEVELS.map(u => (
                      <button
                        key={u.value}
                        type="button"
                        className={`at-urgency-btn ${urgency === u.value ? 'selected' : ''}`}
                        style={urgency === u.value ? { borderColor: urgencyColor(u.value), background: urgencyColor(u.value) + '22' } : {}}
                        onClick={() => setUrgency(u.value)}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                  {urgency === 'immediate' && (
                    <div className="at-warning-box">
                      🚨 If this is an emergency, <strong>call 911 or 112 NOW</strong> before filling this form.
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="at-field-group">
                  <label>Description <span className="at-required">*</span></label>
                  <textarea
                    className="at-textarea"
                    rows={5}
                    placeholder="Describe what you witnessed or suspect. Include as much detail as is safe to share — dates, patterns, conditions observed."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                  />
                  <span className="at-char-hint">{description.length} chars — more detail helps investigators</span>
                </div>

                {/* Location */}
                <div className="at-field-row">
                  <div className="at-field-group">
                    <label>General Location</label>
                    <input
                      className="at-input"
                      type="text"
                      placeholder="City, region, or landmark — never GPS coordinates"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                    />
                    <span className="at-char-hint">Do not enter GPS coordinates to protect everyone's safety</span>
                  </div>
                  <div className="at-field-group">
                    <label>Estimated Number of Victims</label>
                    <input
                      className="at-input"
                      type="text"
                      placeholder="e.g. 1, 2–5, unknown"
                      value={victimCount}
                      onChange={e => setVictimCount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Suspect description */}
                <div className="at-field-group">
                  <label>Suspect / Vehicle Description <span className="at-optional">(optional)</span></label>
                  <textarea
                    className="at-textarea"
                    rows={3}
                    placeholder="Physical description, vehicle make/colour/plate, known aliases — only what you safely observed"
                    value={suspectDescription}
                    onChange={e => setSuspectDescription(e.target.value)}
                  />
                </div>

                {/* Anonymous toggle */}
                <div className="at-field-group">
                  <div className="at-anon-toggle">
                    <input
                      type="checkbox"
                      id="anon-check"
                      checked={anonymous}
                      onChange={e => setAnonymous(e.target.checked)}
                    />
                    <label htmlFor="anon-check">
                      Submit anonymously (recommended)
                      {anonymous
                        ? ' — your wallet address will NOT be stored with this report'
                        : ' — your wallet address will be attached so advocates can reach you'}
                    </label>
                  </div>
                </div>

                {submitResult?.success === false && (
                  <div className="at-error-box">{submitResult.message}</div>
                )}

                <button
                  type="submit"
                  className="at-btn at-btn-primary at-btn-submit"
                  disabled={submitting || !reportType || !description}
                >
                  {submitting ? '⏳ Submitting...' : '🔒 Submit Report Securely'}
                </button>

                <p className="at-privacy-note">
                  🔒 Reports are hashed with SHA-256 for tamper-proof integrity. No personal information is required. For immediate danger, always call emergency services first.
                </p>
              </form>
            )}
          </div>
        )}

        {/* ── RESOURCES TAB ────────────────────────────────────────── */}
        {tab === 'resources' && (
          <div className="at-resources-section">
            <div className="at-section-header">
              <h2>Emergency Resources & Hotlines</h2>
              <p>Free, confidential support available 24/7</p>
            </div>
            {loading ? (
              <div className="at-loading">Loading resources…</div>
            ) : (
              <div className="at-resources-grid">
                {resources.map(r => (
                  <div key={r.id} className="at-resource-card">
                    <div className="at-resource-top">
                      <h3>{r.name}</h3>
                      <span className="at-resource-region">{r.region}</span>
                    </div>
                    <div className="at-resource-body">
                      {r.phone && (
                        <div className="at-resource-contact">
                          <span className="at-contact-icon">📞</span>
                          <a href={`tel:${r.phone.replace(/\s/g,'')}`}>{r.phone}</a>
                        </div>
                      )}
                      {r.sms && (
                        <div className="at-resource-contact">
                          <span className="at-contact-icon">💬</span>
                          <span>SMS: {r.sms}</span>
                        </div>
                      )}
                      {r.url && (
                        <div className="at-resource-contact">
                          <span className="at-contact-icon">🌐</span>
                          <a href={r.url} target="_blank" rel="noopener noreferrer">{r.url.replace('https://', '')}</a>
                        </div>
                      )}
                    </div>
                    <div className="at-resource-footer">
                      <span className="at-resource-avail">⏰ {r.available}</span>
                      <span className="at-resource-langs">🌍 {r.languages.join(', ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── WARNING SIGNS TAB ────────────────────────────────────── */}
        {tab === 'warning-signs' && (
          <div className="at-signs-section">
            <div className="at-section-header">
              <h2>How to Recognize Trafficking</h2>
              <p>Knowing the warning signs can save a life. If you see these signs, do not confront the suspected trafficker — report it.</p>
            </div>
            {loading ? (
              <div className="at-loading">Loading…</div>
            ) : (
              <div className="at-signs-grid">
                {warningSigns.map((cat, i) => (
                  <div key={i} className="at-signs-card">
                    <h3 className="at-signs-category">{cat.category} Trafficking</h3>
                    <ul className="at-signs-list">
                      {cat.signs.map((sign, j) => (
                        <li key={j} className="at-sign-item">
                          <span className="at-sign-dot">⚠</span>
                          {sign}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            <div className="at-action-callout">
              <div className="at-callout-icon">🛡️</div>
              <div>
                <strong>Seen something suspicious?</strong>
                <p>Do NOT confront the trafficker — you could put victims at greater risk. Report to the hotline or use the anonymous report form above.</p>
              </div>
              <button className="at-btn at-btn-primary" onClick={() => setTab('report')}>
                File a Report →
              </button>
            </div>
          </div>
        )}

        {/* ── COMMUNITY ALERTS TAB ─────────────────────────────────── */}
        {tab === 'alerts' && (
          <div className="at-alerts-section">
            <div className="at-section-header">
              <h2>Community Safety Alerts</h2>
              <p>Verified community members can post regional safety alerts. Always corroborate with official sources.</p>
            </div>

            {/* Post alert form */}
            {isConnected && (
              <form className="at-alert-form" onSubmit={handlePostAlert}>
                <h3>Post a Community Alert</h3>
                <div className="at-field-row">
                  <div className="at-field-group">
                    <label>Region / Area</label>
                    <input className="at-input" placeholder="e.g. Lagos, Nigeria" value={alertRegion} onChange={e => setAlertRegion(e.target.value)} required />
                  </div>
                  <div className="at-field-group">
                    <label>Severity</label>
                    <select className="at-input" value={alertSeverity} onChange={e => setAlertSeverity(e.target.value)}>
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🔴 High</option>
                    </select>
                  </div>
                </div>
                <div className="at-field-group">
                  <label>Alert Message</label>
                  <textarea className="at-textarea" rows={3} placeholder="Describe the safety concern in this region — avoid naming victims" value={alertMessage} onChange={e => setAlertMessage(e.target.value)} required />
                </div>
                {alertResult && (
                  <div className={alertResult.success ? 'at-success-inline' : 'at-error-box'}>
                    {alertResult.success ? '✅ Alert posted successfully.' : alertResult.message}
                  </div>
                )}
                <button type="submit" className="at-btn at-btn-secondary" disabled={postingAlert}>
                  {postingAlert ? '⏳ Posting…' : '📢 Post Alert'}
                </button>
              </form>
            )}

            {/* Alerts list */}
            <div className="at-alerts-list">
              {alerts.length === 0 ? (
                <div className="at-empty">No community alerts at this time.</div>
              ) : (
                alerts.map(a => (
                  <div key={a.id} className={`at-alert-item severity-${a.severity}`}>
                    <div className="at-alert-header">
                      <span className="at-alert-region">📍 {a.region}</span>
                      <span className="at-alert-severity" style={{ color: severityColor(a.severity) }}>
                        {a.severity.toUpperCase()}
                      </span>
                      <span className="at-alert-time">{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="at-alert-message">{a.message}</p>
                    <div className="at-alert-footer">
                      <span className="at-alert-poster">Posted by: {a.postedBy.slice(0,6)}…{a.postedBy.slice(-4)}</span>
                      {a.verified && <span className="at-verified-badge">✅ Verified</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── MY REPORTS TAB ───────────────────────────────────────── */}
        {tab === 'my-reports' && (
          <div className="at-my-reports-section">
            <div className="at-section-header">
              <h2>My Submitted Reports</h2>
              <p>Only reports submitted with your wallet attached are shown here.</p>
            </div>
            {myReports.length === 0 ? (
              <div className="at-empty">No linked reports found for this wallet.</div>
            ) : (
              <div className="at-my-reports-list">
                {myReports.map(r => (
                  <div key={r.id} className="at-my-report-item">
                    <div className="at-my-report-header">
                      <span className="at-report-ref">{r.referenceCode}</span>
                      <span className="at-report-type">{r.reportType}</span>
                      <span className="at-report-urgency" style={{ color: urgencyColor(r.urgency) }}>{r.urgency}</span>
                      <span className="at-report-status">{statusLabel(r.status)}</span>
                    </div>
                    <div className="at-my-report-meta">
                      <span>Submitted: {new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="at-report-hash">
                      <span>Integrity hash: </span><code>{r.contentHash?.slice(0, 32)}…</code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
