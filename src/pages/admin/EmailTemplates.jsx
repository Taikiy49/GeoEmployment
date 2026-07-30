import React, { useState, useEffect } from 'react';
import { appClient } from '@/api/localClient';
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
    appClient.entities.EmailTemplate.list('-created_date', 100).then(t => {
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
      await appClient.entities.EmailTemplate.update(editingId, formData);
    } else {
      await appClient.entities.EmailTemplate.create(formData);
    }
    setSaving(false);
    closeForm();
    load();
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (confirm('Delete this template?')) {
      await appClient.entities.EmailTemplate.delete(id);
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
      subject: `Your Geolabs, Inc. Application — ${STAGE_LABELS[stageKey]}`,
      body: '',
    });
  };

  const stageCustomCount = STAGE_KEYS.filter(k => stageTemplateMap[k]).length;
  const customCount = customTemplates.length;

  const inputClass = "w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A65F2A]/30 focus:border-[#A65F2A] transition-all";

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Email Templates</h1>
            <p className="text-sm text-gray-500 mt-0.5">Customize emails candidates receive at each hiring stage</p>
          </div>
          <Button onClick={() => { setActiveTab('custom'); openForm(); }} className="rounded-xl px-5 h-10 text-sm bg-[#A65F2A] hover:bg-[#8A4A22] text-white font-bold shadow-lg shadow-[#A65F2A]/20">
            <Plus className="w-4 h-4 mr-1.5" /> New Template
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('stage')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'stage' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Stage Emails
            <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${stageCustomCount > 0 ? 'bg-[#A65F2A]/10 text-[#8A4A22]' : 'bg-gray-100 text-gray-400'}`}>
              {stageCustomCount}/{STAGE_KEYS.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'custom' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Custom Templates
            {customCount > 0 && (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-[#A65F2A]/10 text-[#8A4A22]">{customCount}</span>
            )}
          </button>
        </div>

        {/* Stage Emails */}
        {activeTab === 'stage' && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                These emails are sent <strong>automatically</strong> when a candidate's stage is updated. Stages without a custom template use the built-in default.
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
                        ? 'bg-white border-gray-200 hover:border-[#A65F2A]/50 hover:shadow-sm'
                        : 'bg-gray-50 border-dashed border-gray-200 hover:border-[#A65F2A]/40 hover:bg-white'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tmpl ? 'bg-[#A65F2A]/10 border border-[#A65F2A]/20' : 'bg-gray-200'}`}>
                      {tmpl
                        ? <CheckCircle className="w-4 h-4 text-[#8A4A22]" />
                        : <Circle className="w-4 h-4 text-gray-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-gray-900">{STAGE_LABELS[stageKey]}</span>
                        {tmpl && <span className="text-[10px] font-bold text-[#8A4A22]">Custom</span>}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {tmpl ? tmpl.subject : <span className="italic text-gray-400">Using default template</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {tmpl && (
                        <button
                          onClick={(e) => handleDelete(tmpl.id, e)}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#8A4A22] transition-colors" />
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
                <div className="w-6 h-6 border-2 border-[#1e2a3a] border-t-[#A65F2A] rounded-full animate-spin" />
              </div>
            ) : customTemplates.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No custom templates yet.</p>
                <p className="text-xs text-gray-400 mt-1">Create templates for ad-hoc emails and follow-ups.</p>
                <Button onClick={() => openForm()} className="mt-5 rounded-xl px-5 h-10 text-sm bg-[#A65F2A] hover:bg-[#8A4A22] text-white font-bold">
                  <Plus className="w-4 h-4 mr-1.5" /> Create Template
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {customTemplates.map(t => (
                  <div key={t.id} className="group bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3 hover:border-[#A65F2A]/40 hover:shadow-sm transition-all">
                    <div className="w-9 h-9 rounded-xl bg-[#A65F2A]/10 border border-[#A65F2A]/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-[#8A4A22]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900">{t.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${t.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          {t.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{t.subject}</p>
                      {t.notes && <p className="text-[11px] text-gray-400 mt-1 italic truncate">{t.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openForm(t)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => handleDelete(t.id, e)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-base font-bold text-gray-900">{editingId ? 'Edit Template' : 'New Template'}</h2>
                {formData.stageKey && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Zap className="w-3 h-3 text-[#8A4A22]" />
                    <span className="text-xs text-[#8A4A22] font-semibold">Auto-sent on: {STAGE_LABELS[formData.stageKey]}</span>
                  </div>
                )}
              </div>
              <button onClick={closeForm} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Template Name *</label>
                  <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Interview Invitation" className={inputClass} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Type</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className={inputClass}>
                    {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {!formData.stageKey && (
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Link to Stage <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
                  <select value={formData.stageKey || ''} onChange={e => setFormData({ ...formData, stageKey: e.target.value })} className={inputClass}>
                    <option value="">None (manual use only)</option>
                    {STAGE_KEYS.map(k => <option key={k} value={k}>{STAGE_LABELS[k]}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Email Subject *</label>
                <input value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder="e.g., Your Geolabs, Inc. Application — {{stageLabel}}" className={inputClass} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Message Body *</label>
                <textarea
                  value={formData.body}
                  onChange={e => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Write your message. The email is auto-wrapped in Geolabs, Inc. branding."
                  rows={7}
                  className={`${inputClass} resize-none`}
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['{{firstName}}', '{{lastName}}', '{{position}}', '{{stageLabel}}'].map(v => (
                    <code key={v}
                      className="text-[11px] bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-[#8A4A22] cursor-pointer hover:bg-[#A65F2A]/10 transition-colors"
                      onClick={() => setFormData(prev => ({ ...prev, body: prev.body + v }))}
                    >
                      {v}
                    </code>
                  ))}
                  <span className="text-[10px] text-gray-400 self-center ml-1">click to insert</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Internal Notes</label>
                <textarea value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Team notes about when to use this template…" rows={2} className={`${inputClass} resize-none`} />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${formData.isActive ? 'bg-[#A65F2A]' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-xs font-semibold text-gray-600">Active — send automatically</span>
              </label>
            </div>

            <div className="p-5 border-t border-gray-200 flex items-center justify-between gap-2 sticky bottom-0 bg-white">
              {editingId && (
                <button onClick={(e) => { handleDelete(editingId, e); closeForm(); }} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1.5 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button onClick={closeForm} variant="outline" className="rounded-xl px-4 h-9 text-sm border-gray-200 bg-white text-gray-600 hover:bg-gray-100">Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="rounded-xl px-5 h-9 text-sm bg-[#A65F2A] hover:bg-[#8A4A22] text-white font-bold">
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