import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { useLocation } from 'react-router-dom';
import { Button } from '../../components/forms/Button';
import { Input } from '../../components/forms/Input';
import { Sliders, LayoutGrid, CheckSquare, Save } from 'lucide-react';

export const Settings: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'general';

  // CRM preferences
  const [crmName, setCrmName] = useState('VQ Leads CRM');
  const [currency, setCurrency] = useState('USD ($)');
  const [timeout, setTimeoutVal] = useState('60 minutes');

  // Round-Robin preferences
  const [fallbackAgent, setFallbackAgent] = useState('Sarah Conner (Admin)');
  const [rrDelay, setRrDelay] = useState('5 minutes');

  // Commissions preferences
  const [baseRate, setBaseRate] = useState('10.00%');
  const [mandatoryApproval, setMandatoryApproval] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Settings saved successfully! (Simulation)");
  };

  return (
    <div className="p-8 max-w-4xl mx-auto text-left space-y-6">
      {/* Tab Selectors */}
      <div className="flex border-b border-border/80 pb-0.5 select-none gap-2 overflow-x-auto">
        <a
          href="/settings"
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 -mb-[2px] transition-all capitalize whitespace-nowrap ${
            activeTab === 'general' || activeTab === 'crm' 
              ? 'text-primary-foreground border-primary' 
              : 'text-muted-foreground hover:text-foreground border-transparent'
          }`}
        >
          <LayoutGrid size={14} />
          General
        </a>
        <a
          href="/settings?tab=leads"
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 -mb-[2px] transition-all capitalize whitespace-nowrap ${
            activeTab === 'leads' || activeTab === 'routing'
              ? 'text-primary-foreground border-primary' 
              : 'text-muted-foreground hover:text-foreground border-transparent'
          }`}
        >
          <Sliders size={14} />
          Leads & Routing
        </a>
        <a
          href="/settings?tab=commissions"
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 -mb-[2px] transition-all capitalize whitespace-nowrap ${
            activeTab === 'commissions' 
              ? 'text-primary-foreground border-primary' 
              : 'text-muted-foreground hover:text-foreground border-transparent'
          }`}
        >
          <CheckSquare size={14} />
          Commissions
        </a>
        <a
          href="/settings?tab=email"
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 -mb-[2px] transition-all capitalize whitespace-nowrap ${
            activeTab === 'email' 
              ? 'text-primary-foreground border-primary' 
              : 'text-muted-foreground hover:text-foreground border-transparent'
          }`}
        >
          Email
        </a>
        <a
          href="/settings?tab=notifications"
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 -mb-[2px] transition-all capitalize whitespace-nowrap ${
            activeTab === 'notifications' 
              ? 'text-primary-foreground border-primary' 
              : 'text-muted-foreground hover:text-foreground border-transparent'
          }`}
        >
          Notifications
        </a>
        <a
          href="/settings?tab=api"
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 -mb-[2px] transition-all capitalize whitespace-nowrap ${
            activeTab === 'api' 
              ? 'text-primary-foreground border-primary' 
              : 'text-muted-foreground hover:text-foreground border-transparent'
          }`}
        >
          API
        </a>
      </div>

      <form onSubmit={handleSave}>
        <Card className="p-8 space-y-6 bg-card border border-border/85 rounded-xl shadow-xl">
          {(activeTab === 'general' || activeTab === 'crm') && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">CRM General Preferences</h3>
                <p className="text-xs text-muted-foreground">Modify the general look and feel of the CRM workspace portal.</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Organization/CRM Name</label>
                <Input 
                  type="text" 
                  value={crmName}
                  onChange={e => setCrmName(e.target.value)}
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Default Currency</label>
                  <select 
                    value={currency} 
                    onChange={e => setCurrency(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer"
                  >
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="GBP (£)">GBP (£)</option>
                    <option value="INR (₹)">INR (₹)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Inactivity Session Timeout</label>
                  <select 
                    value={timeout} 
                    onChange={e => setTimeoutVal(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer"
                  >
                    <option value="30 minutes">30 minutes</option>
                    <option value="60 minutes">60 minutes</option>
                    <option value="120 minutes">120 minutes</option>
                    <option value="Never">Never Timeout</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'leads' || activeTab === 'routing') && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Round-Robin Inbound Routing</h3>
                <p className="text-xs text-muted-foreground">Adjust the settings for automatic Celery Round-Robin lead routing.</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Fallback/Backup Assignment Agent</label>
                <Input 
                  type="text" 
                  value={fallbackAgent}
                  onChange={e => setFallbackAgent(e.target.value)}
                  required 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Celery Assignment Execution Delay</label>
                <select 
                  value={rrDelay} 
                  onChange={e => setRrDelay(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer"
                >
                  <option value="Instant">Instant (0 seconds delay)</option>
                  <option value="1 minute">1 minute delay</option>
                  <option value="5 minutes">5 minutes delay</option>
                  <option value="15 minutes">15 minutes delay</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'commissions' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Commission Preferences</h3>
                <p className="text-xs text-muted-foreground">Configure global rates and validation settings for ledger payments.</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Global Base Commission Rate</label>
                <Input 
                  type="text" 
                  value={baseRate}
                  onChange={e => setBaseRate(e.target.value)}
                  required 
                />
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/10 border border-border/40 cursor-pointer select-none">
                <input 
                  id="mandatory-approval"
                  type="checkbox"
                  checked={mandatoryApproval}
                  onChange={() => setMandatoryApproval(!mandatoryApproval)}
                  className="rounded border-input text-primary focus:ring-ring bg-muted/20 h-4 w-4"
                />
                <label htmlFor="mandatory-approval" className="text-xs font-semibold text-foreground cursor-pointer">
                  Require Mandatory Admin Approval for Commission Payouts
                </label>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Email Settings</h3>
                <p className="text-xs text-muted-foreground">Configure SMTP and outgoing email settings.</p>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Notification Preferences</h3>
                <p className="text-xs text-muted-foreground">Manage alerts, webhooks, and push notifications.</p>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">API Settings</h3>
                <p className="text-xs text-muted-foreground">Manage API keys and integration webhooks.</p>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-border/40">
            <Button type="submit" className="flex items-center gap-2">
              <Save size={16} />
              Save Configuration
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
export default Settings;
