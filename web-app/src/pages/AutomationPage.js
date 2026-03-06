import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { automationApi } from '../services/api';
import './AutomationPage.css';

export default function AutomationPage() {
  const { isConnected, isLoading, connectWallet, wallet } = useApp();
  const [automations, setAutomations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, paused: 0, totalExecutions: 0 });

  useEffect(() => {
    if (wallet?.address) {
      loadAutomations();
      loadTemplates();
      loadStats();
    }
  }, [wallet?.address]);

  const loadAutomations = async () => {
    try {
      const response = await automationApi.getAutomations(wallet.address);
      setAutomations(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading automations:', error);
      setAutomations([]);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await automationApi.getTemplates();
      setTemplates(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    }
  };

  const loadStats = async () => {
    try {
      const response = await automationApi.getStats(wallet.address);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateAutomation = async (template) => {
    try {
      const automationData = {
        walletAddress: wallet.address,
        name: template.name,
        type: template.type,
        trigger: template.defaultTrigger,
        action: {
          type: template.type === 'price_alert' ? 'notify' : 'transfer',
          amount: '0',
          token: 'CIV'
        },
        notifications: {
          enabled: true,
          channels: ['push']
        }
      };

      await automationApi.createAutomation(automationData);
      await loadAutomations();
      await loadStats();
      alert(`${template.name} created! You can configure it in the automation list.`);
    } catch (error) {
      console.error('Error creating automation:', error);
      alert('Failed to create automation. Please try again.');
    }
  };

  const handleToggleAutomation = async (id) => {
    try {
      await automationApi.toggleAutomation(id);
      await loadAutomations();
      await loadStats();
    } catch (error) {
      console.error('Error toggling automation:', error);
      alert('Failed to toggle automation.');
    }
  };

  const handleDeleteAutomation = async (id) => {
    if (!window.confirm('Delete this automation?')) return;

    try {
      await automationApi.deleteAutomation(id);
      await loadAutomations();
      await loadStats();
    } catch (error) {
      console.error('Error deleting automation:', error);
      alert('Failed to delete automation.');
    }
  };

  const handleExecuteNow = async (id) => {
    try {
      await automationApi.executeAutomation(id);
      await loadAutomations();
      await loadStats();
      alert('Automation executed successfully!');
    } catch (error) {
      console.error('Error executing automation:', error);
      alert('Failed to execute automation.');
    }
  };

  const formatNextRun = (nextRun) => {
    if (!nextRun) return 'N/A';
    const date = new Date(nextRun);
    const now = new Date();
    const diffMs = date - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays > 1) return `${diffDays} days`;
    if (diffHours > 1) return `${diffHours} hours`;
    return 'Soon';
  };
  if (isLoading) {
    return (
      <div className="automation-page">
        <div className="automation-container">
          <div className="not-connected">
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }
  if (!isConnected) {
    return (
      <div className="automation-page">
        <div className="automation-container">
          <div className="not-connected">
            <h2>Wallet Not Connected</h2>
            <p>Please connect your wallet to manage automations.</p>
            <button className="btn btn-primary" onClick={connectWallet}>
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="automation-page">
      <div className="automation-container">
        <div className="automation-header">
          <h1>Smart Automation</h1>
          <p className="subtitle">Automate your transactions with smart contracts</p>
        </div>

        <div className="stats-bar" style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          <div className="stat-item" style={{ flex: 1, textAlign: 'center', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>{stats.total}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Total</div>
          </div>
          <div className="stat-item" style={{ flex: 1, textAlign: 'center', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00a884' }}>{stats.active}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Active</div>
          </div>
          <div className="stat-item" style={{ flex: 1, textAlign: 'center', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f5576c' }}>{stats.paused}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Paused</div>
          </div>
          <div className="stat-item" style={{ flex: 1, textAlign: 'center', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#764ba2' }}>{stats.totalExecutions}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Executions</div>
          </div>
        </div>

        <div className="create-automation">
          <h2>Create New Automation</h2>
          <div className="automation-templates">
            {templates.map((template) => (
              <div key={template.id} className="template-card">
                <div className="template-icon">{template.icon}</div>
                <h3>{template.name}</h3>
                <p>{template.description}</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleCreateAutomation(template)}
                >
                  Create
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="active-automations">
          <h2>Your Automations ({automations.length})</h2>
          {automations.length > 0 ? (
            automations.map((automation) => (
              <div key={automation._id} className="automation-item">
                <div className="automation-info">
                  <h3>{automation.name}</h3>
                  <p className="automation-type">{automation.type}</p>
                </div>
                <div className="automation-status">
                  <span className={`status-badge ${automation.status}`}>
                    {automation.status === 'active' ? '✓ Active' : '⏸ Paused'}
                  </span>
                  <p className="next-run">
                    Next run: {formatNextRun(automation.nextRun)}
                  </p>
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    Executed {automation.executionCount} times
                  </p>
                </div>
                <div className="automation-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleToggleAutomation(automation._id)}
                  >
                    {automation.status === 'active' ? 'Pause' : 'Resume'}
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleExecuteNow(automation._id)}
                  >
                    Run Now
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleDeleteAutomation(automation._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>No automations created yet. Choose a template above to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
