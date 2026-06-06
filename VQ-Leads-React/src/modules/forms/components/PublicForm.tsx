import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api, type LeadForm } from '../../../api';
import { Button } from '../../../components/forms/Button';
import { Input } from '../../../components/forms/Input';
import { X, Check } from 'lucide-react';

export const PublicForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [value, setValue] = useState('0.00');

  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [assignedAgent, setAssignedAgent] = useState('');
  const [formDetail, setFormDetail] = useState<LeadForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setError('');
        setLoading(true);
        if (id) {
          const detail = await api.getPublicForm(Number(id));
          setFormDetail(detail);
        }
      } catch (err) {
        setError('Submission form not found or has been disabled.');
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [id]);

  const submitMutation = useMutation({
    mutationFn: (data: any) => api.submitPublicForm(Number(id), data),
    onSuccess: (res) => {
      setAssignedAgent(res.assigned_to);
      setSubmitSuccess(true);
    },
    onError: (err: any) => {
      setError(err.message || 'Submission failed. Please check inputs.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name.trim()) return;
    submitMutation.mutate({
      name,
      email,
      phone,
      company,
      notes,
      value
    });
  };

  if (loading && !submitSuccess) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm font-semibold animate-pulse">Loading submission portal...</div>
      </div>
    );
  }

  if (error && !submitSuccess) {
    return (
      <div className="w-screen min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-[500px] bg-card border border-border/80 rounded-2xl p-8 shadow-2xl text-center">
          <div className="h-14 w-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-6">
            <X size={30} />
          </div>
          <h3 className="text-xl font-bold text-foreground">Portal Inaccessible</h3>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(circle_at_90%_80%,rgba(59,130,246,0.06)_0%,rgba(0,0,0,0)_50%),radial-gradient(circle_at_10%_20%,rgba(168,85,247,0.06)_0%,rgba(0,0,0,0)_50%)] bg-background">
      <div className="w-full max-w-[550px] bg-card border border-border/80 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-blue-500" />
        
        {submitSuccess ? (
          <div className="py-8 text-center flex flex-col items-center justify-center gap-4">
            <div className="h-16 w-16 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center">
              <Check size={32} />
            </div>
            <h3 className="text-2xl font-bold text-foreground mt-2">Submission Received</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[400px]">
              Thank you! Your inquiry details have been registered. Our sales team will get back to you shortly.
              {assignedAgent !== 'Routing in progress (Celery)...' && assignedAgent !== 'Unassigned' && (
                <span className="block mt-4 text-xs font-semibold text-primary">
                  Assigned Account Representative: {assignedAgent}
                </span>
              )}
            </p>
            <Button 
              className="mt-6"
              onClick={() => {
                setName('');
                setEmail('');
                setPhone('');
                setCompany('');
                setNotes('');
                setValue('0.00');
                setSubmitSuccess(false);
              }}
            >
              Submit Another Inquiry
            </Button>
          </div>
        ) : (
          <>
            <div className="text-left mb-8">
              <h2 className="text-xl font-bold text-foreground">{formDetail?.name}</h2>
              <p className="text-xs text-muted-foreground mt-1">{formDetail?.description || 'Please complete the details below.'}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-semibold text-foreground">Full Name *</label>
                <Input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. John Doe"
                  required 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-semibold text-foreground">Email Address</label>
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="john@example.com"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-semibold text-foreground">Phone Number</label>
                  <Input 
                    type="text" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-semibold text-foreground">Company Name</label>
                  <Input 
                    type="text" 
                    value={company} 
                    onChange={e => setCompany(e.target.value)} 
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-semibold text-foreground">Estimated Deal Size ($)</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={value} 
                    onChange={e => setValue(e.target.value)} 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-semibold text-foreground">Inquiry Details</label>
                <textarea 
                  className="flex w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring min-h-[100px]" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="How can we assist you?"
                />
              </div>

              <Button type="submit" className="w-full mt-4" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? 'Submitting...' : 'Submit Inquiry'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
export default PublicForm;
