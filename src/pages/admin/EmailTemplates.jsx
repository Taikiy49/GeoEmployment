import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit, Trash2, Zap, CheckCircle, Circle, ChevronRight, X, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLayout from '../../components/admin/AdminLayout';

const STAGE_KEYS = ['under_review', 'phone_screen', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'];
const STAGE_LABELS = {
  under_review: 'Under Review', phone_screen: 'Phone Screen', interview: 'Interview',
  offer: 'Offer Extended', hired: 'Hired', rejected: 'Not Selected', withdrawn: 'Withdrawn',
};
const TYPE_OPTIONS = [
  { value: 'stage_update', label: 'Stage Update' },
  { value: 'interview_invitation', label: 'Interview Invitation' },
  { value: 'rejection', label: 'Rejection' },
  { value: 'offer', label: 'Offer' },
  { value: 'general', label: 'General' },
];
const EMPTY_FORM = { name: '', stageKey: '', type: 'general', subject: '', body: '', isActive: true, notes: '' };

export default function EmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('stage');

  const load = () => {
    base44.entities.EmailTemplate.list('-created_date', 100).then(t => {
      setTemplates(t);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const stageTemplateMap = {};
  templates.forEach(t => { if (t.stageKey) stageTemplateMap[t.stageKey] = t; });
  const customTemplates = templates.filter(t => !t.stageKey);

  const openForm = (template = null) => {
    setFormData(template ? { ...template } : { ...EMPTY_FORM });
    setEditingId(template?.id || null);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setFormData(null); setEditingId(null); };

  const handleSave = async () => {
    if (!formData.name || !formData.subject || !formData.body) return alert('Please fill in Name, Subject, and Message Body.');
    setSaving(true);
    if (editingId) {
      await base44.entities.EmailTemplate.update(editingId, formData);
    } else {
      await base44.entities.EmailTemplate.create(formData);
    }
    setSaving(false);
    closeForm();
    load();
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (confirm('Delete this template?')) {
      await base44.entities.EmailTemplate.delete(id);
      load();
    }
  };

  const openStageTemplate = (stageKey) => {
    const existing = stageTemplateMap[stageKey];
    openForm(existing || {
      ...EMPTY_FORM,
      name: `${STAGE_LABELS[stageKey]} Email`,
      stageKey,
      type: 'stage_update',
      subject: `Your Geolabs Application — ${STAGE_LABELS[stageKey]}`,
      body: '',
    });
  };

  const stageCustomCount = STAGE_KEYS.filter(k => stageTemplateMap[k]).length;
  const customCount = customTemplates.length;

  const inputClass = "w-full px-4 py-2.5 text-sm rounded-xl border border-[#1e2a3a] bg-[#060e1a] text-white placeholder-[#4a5568] focus:outline-none focus:ring-2 focus:ring-[#F5C400]/30 focus:border-[#F5C400] transition-all";

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Email Templates</h1>
            <p className="text-sm text-[#64748b] mt-0.5">Customize emails candidates receive at each hiring stage</p>
          </div>
          <Button onClick={() => { setActiveTab('custom'); openForm(); }} className="rounded-xl px-5 h-10 text-sm bg-[#F5C400] hover:bg-[#EFB506] text-[#0d1117] font-bold shadow-lg shadow-[#F5C400]/20">
            <Plus className="w-4 h-4 mr-1.5" /> New Template
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#0d1b2a] border border-[#1e2a3a] p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('stage')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'stage' ? 'bg-[#1e2a3a] text-white shadow-sm' : 'text-[#64748b] hover:text-white'}`}
          >
            Stage Emails
            <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${stageCustomCount > 0 ? 'bg-[#F5C400]/10 text-[#F5C400]' : 'bg-[#1e2a3a] text-[#64748b]'}`}>
              {stageCustomCount}/{STAGE_KEYS.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'custom' ? 'bg-[#1e2a3a] text-white shadow-sm' : 'text-[#64748b] hover:text-white'}`}
          >
            Custom Templates
            {customCount > 0 && (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-[#F5C400]/10 text-[#F5C400]">{customCount}</span>
            )}
          </button>
        </div>

        {/* Stage Emails */}
        {activeTab === 'stage' && (
          <div className="space-y-3">
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300/80 leading-relaxed">
                These emails are sent <strong className="text-amber-300">automatically</strong> when a candidate's stage is updated. Stages without a custom template use the built-in default.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STAGE_KEYS.map(stageKey => {
                const tmpl = stageTemplateMap[stageKey];
                return (
                  <div
                    key={stageKey}
                    onClick={() => openStageTemplate(stageKey)}
                    className={`group flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      tmpl
                        ? 'bg-[#0d1b2a] border-[#1e2a3a] hover:border-[#F5C400]/40'
                        : 'bg-[#060e1a] border-dashed border-[#1e2a3a] hover:border-[#F5C400]/40 hover:bg-[#0d1b2a]'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tmpl ? 'bg-[#F5C400]/10 border border-[#F5C400]/20' : 'bg-[#1e2a3a]'}`}>
                      {tmpl
                        ? <CheckCircle className="w-4 h-4 text-[#F5C400]" />
                        : <Circle className="w-4 h-4 text-[#4a5568]" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-white">{STAGE_LABELS[stageKey]}</span>
                        {tmpl && <span className="text-[10px] font-bold text-[#F5C400]">Custom</span>}
                      </div>
                      <p className="text-xs text-[#64748b] truncate">
                        {tmpl ? tmpl.subject : <span className="italic text-[#4a5568]">Using default template</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {tmpl && (
                        <button
                          onClick={(e) => handleDelete(tmpl.id, e)}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-[#4a5568] hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <ChevronRight className="w-4 h-4 text-[#2d3f55] group-hover:text-[#F5C400] transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom Templates */}
        {activeTab === 'custom' && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-[#1e2a3a] border-t-[#F5C400] rounded-full animate-spin" />
              </div>
            ) : customTemplates.length === 0 ? (
              <div className="bg-[#0d1b2a] rounded-2xl border border-dashed border-[#1e2a3a] py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#1e2a3a] flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-[#4a5568]" />
                </div>
                <p className="text-sm text-[#64748b]">No custom templates yet.</p>
                <p className="text-xs text-[#4a5568] mt-1">Create templates for ad-hoc emails and follow-ups.</p>
                <Button onClick={() => openForm()} className="mt-5 rounded-xl px-5 h-10 text-sm bg-[#F5C400] hover:bg-[#EFB506] text-[#0d1117] font-bold">
                  <Plus className="w-4 h-4 mr-1.5" /> Create Template
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {customTemplates.map(t => (
                  <div key={t.id} className="group bg-[#0d1b2a] rounded-xl border border-[#1e2a3a] p-4 flex items-start gap-3 hover:border-[#F5C400]/30 transition-all">
                    <div className="w-9 h-9 rounded-xl bg-[#F5C400]/10 border border-[#F5C400]/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-[#F5C400]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white">{t.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${t.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[#1e2a3a] text-[#64748b] border-[#2d3f55]'}`}>
                          {t.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748b] truncate">{t.subject}</p>
                      {t.notes && <p className="text-[11px] text-[#4a5568] mt-1 italic truncate">{t.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openForm(t)} className="p-1.5 rounded-lg hover:bg-[#1e2a3a] text-[#4a5568] hover:text-white transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => handleDelete(t.id, e)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#4a5568] hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && formData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1b2a] rounded-2xl border border-[#1e2a3a] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#1e2a3a] sticky top-0 bg-[#0d1b2a] z-10">
              <div>
                <h2 className="text-base font-bold text-white">{editingId ? 'Edit Template' : 'New Template'}</h2>
                {formData.stageKey && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Zap className="w-3 h-3 text-[#F5C400]" />
                    <span className="text-xs text-[#F5C400] font-semibold">Auto-sent on: {STAGE_LABELS[formData.stageKey]}</span>
                  </div>
                )}
              </div>
              <button onClick={closeForm} className="p-2 rounded-xl hover:bg-[#1e2a3a] text-[#64748b] hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest block mb-1.5">Template Name *</label>
                  <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Interview Invitation" className={inputClass} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest block mb-1.5">Type</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className={inputClass}>
                    {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {!formData.stageKey && (
                <div>
                  <label className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest block mb-1.5">Link to Stage <span className="text-[#4a5568] normal-case font-normal">(optional)</span></label>
                  <select value={formData.stageKey || ''} onChange={e => setFormData({ ...formData, stageKey: e.target.value })} className={inputClass}>
                    <option value="">None (manual use only)</option>
                    {STAGE_KEYS.map(k => <option key={k} value={k}>{STAGE_LABELS[k]}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest block mb-1.5">Email Subject *</label>
                <input value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder="e.g., Your Geolabs Application — {{stageLabel}}" className={inputClass} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest block mb-1.5">Message Body *</label>
                <textarea
                  value={formData.body}
                  onChange={e => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Write your message. The email is auto-wrapped in Geolabs branding."
                  rows={7}
                  className={`${inputClass} resize-none`}
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['{{firstName}}', '{{lastName}}', '{{position}}', '{{stageLabel}}'].map(v => (
                    <code key={v}
                      className="text-[11px] bg-[#1e2a3a] border border-[#2d3f55] px-1.5 py-0.5 rounded text-[#F5C400] cursor-pointer hover:bg-[#F5C400]/10 transition-colors"
                      onClick={() => setFormData(prev => ({ ...prev, body: prev.body + v }))}
                    >
                      {v}
                    </code>
                  ))}
                  <span className="text-[10px] text-[#4a5568] self-center ml-1">click to insert</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest block mb-1.5">Internal Notes</label>
                <textarea value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Team notes about when to use this template…" rows={2} className={`${inputClass} resize-none`} />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${formData.isActive ? 'bg-[#F5C400]' : 'bg-[#1e2a3a]'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-xs font-semibold text-[#94a3b8]">Active — send automatically</span>
              </label>
            </div>

            <div className="p-5 border-t border-[#1e2a3a] flex items-center justify-between gap-2 sticky bottom-0 bg-[#0d1b2a]">
              {editingId && (
                <button onClick={(e) => { handleDelete(editingId, e); closeForm(); }} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button onClick={closeForm} variant="outline" className="rounded-xl px-4 h-9 text-sm border-[#1e2a3a] bg-transparent text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-white">Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="rounded-xl px-5 h-9 text-sm bg-[#F5C400] hover:bg-[#EFB506] text-[#0d1117] font-bold">
                  {saving && <div className="w-4 h-4 border-2 border-[#0d1117]/30 border-t-[#0d1117] rounded-full animate-spin mr-2" />}
                  Save Template
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}