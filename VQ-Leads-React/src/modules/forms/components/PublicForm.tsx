import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api, type FormFieldConfig, type LeadForm } from '../../../api';
import { Button } from '../../../components/forms/Button';
import { Input } from '../../../components/forms/Input';
import { X, Check } from 'lucide-react';

export const PublicForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [values, setValues] = useState<Record<string, any>>({});
  const [currentStep, setCurrentStep] = useState(0);

  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [assignedAgent, setAssignedAgent] = useState('');
  const [formDetail, setFormDetail] = useState<LeadForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setError('');
        setLoading(true);
        if (id) {
          const detail = await api.getPublicForm(Number(id));
          setFormDetail(detail);
          const initial: Record<string, any> = {};
          (detail.form_fields || []).forEach(f => {
            initial[f.key] = f.type === 'CHECKBOX' ? [] : '';
          });
          setValues(initial);
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
      if (formDetail?.thank_you_mode === 'REDIRECT' && formDetail.thank_you_redirect_url) {
        window.location.href = formDetail.thank_you_redirect_url;
        return;
      }
      setSubmitSuccess(true);
    },
    onError: (err: any) => {
      setError(err.message || 'Submission failed. Please check inputs.');
    }
  });

  const fields = useMemo<FormFieldConfig[]>(() => formDetail?.form_fields || [], [formDetail]);

  const stepSize = 3;
  const steps = useMemo(() => {
    if (!formDetail?.multi_step_enabled) return [fields];
    const chunks: FormFieldConfig[][] = [];
    for (let i = 0; i < fields.length; i += stepSize) chunks.push(fields.slice(i, i + stepSize));
    return chunks.length ? chunks : [fields];
  }, [fields, formDetail?.multi_step_enabled]);

  const activeFields = steps[currentStep] || [];

  const setField = (key: string, val: any) => setValues(prev => ({ ...prev, [key]: val }));

  const validateField = (field: FormFieldConfig, val: any): string | null => {
    if (field.required) {
      if (field.type === 'CHECKBOX') {
        if (!Array.isArray(val) || val.length === 0) return `${field.label} is required.`;
      } else if (val === '' || val === null || val === undefined) return `${field.label} is required.`;
    }
    if (val === '' || val === null || val === undefined) return null;
    const v = field.validation || {};
    const str = String(val);
    if (v.min_length !== undefined && str.length < v.min_length) return `${field.label} is too short.`;
    if (v.max_length !== undefined && str.length > v.max_length) return `${field.label} is too long.`;
    if (v.pattern) {
      try {
        const re = new RegExp(v.pattern);
        if (!re.test(str)) return `${field.label} format is invalid.`;
      } catch {
        // ignore invalid pattern from config
      }
    }
    if (field.type === 'NUMBER') {
      const num = Number(val);
      if (Number.isNaN(num)) return `${field.label} must be a number.`;
      if (v.min !== undefined && num < v.min) return `${field.label} must be >= ${v.min}.`;
      if (v.max !== undefined && num > v.max) return `${field.label} must be <= ${v.max}.`;
    }
    if (field.type === 'EMAIL' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(str)) return `Invalid email for ${field.label}.`;
    if (field.type === 'PHONE' && !/^[+0-9()\-\s]{6,25}$/.test(str)) return `Invalid phone for ${field.label}.`;
    if (field.type === 'FILE' && val instanceof File && v.max_file_mb) {
      if (val.size > v.max_file_mb * 1024 * 1024) return `${field.label} exceeds max file size (${v.max_file_mb}MB).`;
    }
    return null;
  };

  const validateStep = (stepFields: FormFieldConfig[]) => {
    for (const field of stepFields) {
      const err = validateField(field, values[field.key]);
      if (err) return err;
    }
    return null;
  };

  const buildSubmissionPayload = () => {
    const hasFile = fields.some(f => f.type === 'FILE' && values[f.key] instanceof File);
    if (hasFile) {
      const fd = new FormData();
      const submissionData: Record<string, any> = {};
      fields.forEach(f => {
        const val = values[f.key];
        if (f.type === 'FILE' && val instanceof File) {
          fd.append(f.key, val);
        } else {
          submissionData[f.key] = val;
        }
      });
      fd.append('submission_data', JSON.stringify(submissionData));
      return fd;
    }
    return { submission_data: values };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    const err = validateStep(activeFields);
    if (err) {
      setValidationError(err);
      return;
    }

    if (formDetail?.multi_step_enabled && currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      return;
    }

    submitMutation.mutate(buildSubmissionPayload());
  };

  const handleBack = () => {
    setValidationError('');
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const resetForm = () => {
    const initial: Record<string, any> = {};
    fields.forEach(f => { initial[f.key] = f.type === 'CHECKBOX' ? [] : ''; });
    setValues(initial);
    setCurrentStep(0);
    setValidationError('');
    setSubmitSuccess(false);
  };

  const renderField = (field: FormFieldConfig) => {
    const commonLabel = (
      <label className="text-xs font-semibold text-foreground">
        {field.label}{field.required ? ' *' : ''}
      </label>
    );
    const val = values[field.key];
    const options = field.options || [];

    if (field.type === 'TEXTAREA') {
      return (
        <div key={field.id} className="flex flex-col gap-1 text-left">
          {commonLabel}
          <textarea
            className="flex w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring min-h-[100px]"
            value={val || ''}
            onChange={e => setField(field.key, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.required}
          />
        </div>
      );
    }

    if (field.type === 'DROPDOWN') {
      return (
        <div key={field.id} className="flex flex-col gap-1 text-left">
          {commonLabel}
          <select
            className="flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            value={val || ''}
            onChange={e => setField(field.key, e.target.value)}
            required={field.required}
          >
            <option value="">Select...</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      );
    }

    if (field.type === 'RADIO') {
      return (
        <div key={field.id} className="flex flex-col gap-2 text-left">
          {commonLabel}
          <div className="flex flex-wrap gap-3">
            {options.map(opt => (
              <label key={opt} className="inline-flex items-center gap-1.5 text-xs text-foreground">
                <input type="radio" name={field.key} checked={val === opt} onChange={() => setField(field.key, opt)} />
                {opt}
              </label>
            ))}
          </div>
        </div>
      );
    }

    if (field.type === 'CHECKBOX') {
      const selected: string[] = Array.isArray(val) ? val : [];
      return (
        <div key={field.id} className="flex flex-col gap-2 text-left">
          {commonLabel}
          <div className="flex flex-wrap gap-3">
            {options.map(opt => (
              <label key={opt} className="inline-flex items-center gap-1.5 text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={(e) => {
                    if (e.target.checked) setField(field.key, [...selected, opt]);
                    else setField(field.key, selected.filter(v => v !== opt));
                  }}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      );
    }

    if (field.type === 'FILE') {
      return (
        <div key={field.id} className="flex flex-col gap-1 text-left">
          {commonLabel}
          <input
            type="file"
            className="flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-xs text-foreground"
            onChange={e => setField(field.key, e.target.files?.[0] || null)}
            accept={(field.validation?.file_types || []).join(',')}
          />
        </div>
      );
    }

    const inputType =
      field.type === 'EMAIL' ? 'email'
      : field.type === 'PHONE' ? 'text'
      : field.type === 'NUMBER' ? 'number'
      : field.type === 'DATE' ? 'date'
      : 'text';

    return (
      <div key={field.id} className="flex flex-col gap-1 text-left">
        {commonLabel}
        <Input
          type={inputType}
          value={val || ''}
          onChange={e => setField(field.key, e.target.value)}
          placeholder={field.placeholder || ''}
          required={field.required}
        />
      </div>
    );
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
              {formDetail?.thank_you_mode === 'MESSAGE'
                ? (formDetail.thank_you_message || 'Thank you! Your inquiry details have been registered.')
                : 'Thank you! Your inquiry details have been registered. Our sales team will get back to you shortly.'}
              {assignedAgent !== 'Routing in progress (Celery)...' && assignedAgent !== 'Unassigned' && (
                <span className="block mt-4 text-xs font-semibold text-primary">
                  Assigned Account Representative: {assignedAgent}
                </span>
              )}
            </p>
            <Button 
              className="mt-6"
              onClick={resetForm}
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
              {formDetail?.multi_step_enabled && (
                <div className="flex items-center gap-2">
                  {steps.map((_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= currentStep ? 'bg-primary' : 'bg-border/60'}`} />
                  ))}
                </div>
              )}

              <div className="space-y-4">
                {activeFields.map(renderField)}
              </div>

              {validationError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-xl text-xs text-left font-semibold">
                  {validationError}
                </div>
              )}

              <div className="flex gap-2">
                {formDetail?.multi_step_enabled && currentStep > 0 && (
                  <Button type="button" variant="outline" className="w-1/3 mt-4" onClick={handleBack}>
                    Back
                  </Button>
                )}
                {formDetail?.multi_step_enabled && currentStep < steps.length - 1 ? (
                  <Button type="submit" className="w-full mt-4" disabled={submitMutation.isPending}>
                    Next Step
                  </Button>
                ) : (
                  <Button type="submit" className="w-full mt-4" disabled={submitMutation.isPending}>
                    {submitMutation.isPending ? 'Submitting...' : 'Submit Inquiry'}
                  </Button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
export default PublicForm;
