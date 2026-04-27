import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit, Trash2, Zap, CheckCircle, Circle, ChevronRight, X, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminLayout from '../../components/admin/AdminLayout';

const STAGE_KEYS = ['under_review', 'phone_screen', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'];
const STAGE_LABELS = {
  under_review: 'Under Review', phone_screen: 'Phone Screen', interview: 'Interview',
  offer: 'Offer Extended', hired: 'Hired', rejected: 'Not Selected', withdrawn: 'Withdrawn',
};
const STAGE_COLORS = {
  under_review: 'bg-blue-50 text-blue-700 border-blue-200',
  phone_screen: 'bg-purple-50 text-purple-700 border-purple-200',
  interview: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  offer: 'bg-green-50 text-green-700 border-green-200',
  hired: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  withdrawn: 'bg-gray-50 text-gray-600 border-gray-200',
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
  const [activeTab, setActiveTab] = useState('stage'); // 'stage' | 'custom'

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
    if (confirm('Delete this template? The stage will revert to the built-in default email.')) {
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

  const customCount = customTemplates.length;
  const stageCustomCount = STAGE_KEYS.filter(k => stageTemplateMap[k]).length;

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-navy">Email Templates</h1>
            <p className="text-sm text-[#6b7280] mt-0.5">Customize the emails candidates receive at each hiring stage</p>
          </div>
          <Button onClick={() => { setActiveTab('custom'); openForm(); }} className="rounded-full px-5 h-9 text-sm bg-bronze hover:bg-bronze-dark text-white">
            <Plus className="w-4 h-4 mr-1.5" /> New Template
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#f3f4f6] p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('stage')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'stage' ? 'bg-white shadow-sm text-navy' : 'text-[#6b7280] hover:text-navy'}`}
          >
            Stage Emails
            <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${stageCustomCount > 0 ? 'bg-bronze/15 text-bronze' : 'bg-gray-200 text-gray-500'}`}>
              {stageCustomCount}/{STAGE_KEYS.length} custom
            </span>
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'custom' ? 'bg-white shadow-sm text-navy' : 'text-[#6b7280] hover:text-navy'}`}
          >
            Custom Templates
            {customCount > 0 && (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-bronze/15 text-bronze">{customCount}</span>
            )}
          </button>
        </div>

        {/* Stage Emails Tab */}
        {activeTab === 'stage' && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                These emails are sent <strong>automatically</strong> when a candidate's stage is updated. Stages without a custom template use the built-in default. Click any stage to customize it.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STAGE_KEYS.map(stageKey => {
                const tmpl = stageTemplateMap[stageKey];
                return (
                  <div
                    key={stageKey}
                    onClick={() => openStageTemplate(stageKey)}
                    className={`group flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${
                      tmpl
                        ? 'bg-white border-[#e5e7eb] hover:border-bronze/40'
                        : 'bg-[#fafafa] border-dashed border-[#d1d5db] hover:border-bronze/40 hover:bg-[#fdf7f1]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tmpl ? 'bg-bronze/10' : 'bg-gray-100'}`}>
                      {tmpl
                        ? <CheckCircle className="w-4 h-4 text-bronze" />
                        : <Circle className="w-4 h-4 text-[#9ca3af]" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STAGE_COLORS[stageKey]}`}>
                          {STAGE_LABELS[stageKey]}
                        </span>
                        {tmpl && (
                          <span className="text-[10px] font-semibold text-bronze">Custom</span>
                        )}
                      </div>
                      <p className="text-xs text-[#6b7280] truncate">
                        {tmpl ? tmpl.subject : <span className="italic text-[#9ca3af]">Using default template</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {tmpl && (
                        <button
                          onClick={(e) => handleDelete(tmpl.id, e)}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-[#9ca3af] hover:text-red-500 transition-all"
                          title="Remove custom template (revert to default)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <ChevronRight className="w-4 h-4 text-[#9ca3af] group-hover:text-bronze transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom Templates Tab */}
        {activeTab === 'custom' && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-4 border-bronze/30 border-t-bronze rounded-full animate-spin" />
              </div>
            ) : customTemplates.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-[#d1d5db] py-16 text-center">
                <Mail className="w-8 h-8 text-[#d1d5db] mx-auto mb-3" />
                <p className="text-sm text-[#9ca3af]">No custom templates yet.</p>
                <p className="text-xs text-[#9ca3af] mt-1">Create templates for ad-hoc emails, follow-ups, or general communications.</p>
                <Button onClick={() => openForm()} className="mt-4 rounded-full px-5 h-9 text-sm bg-bronze hover:bg-bronze-dark text-white">
                  <Plus className="w-4 h-4 mr-1.5" /> Create Template
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {customTemplates.map(t => (
                  <div key={t.id} className="group bg-white rounded-xl border border-[#e5e7eb] p-4 flex items-start gap-3 hover:border-bronze/30 hover:shadow-sm transition-all">
                    <div className="w-8 h-8 rounded-lg bg-bronze/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-bronze" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-navy">{t.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${t.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {t.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-[#6b7280] truncate">{t.subject}</p>
                      {t.notes && <p className="text-[11px] text-[#9ca3af] mt-1 italic truncate">{t.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openForm(t)} className="p-1.5 rounded-lg hover:bg-[#f3f4f6] text-[#6b7280] hover:text-navy transition-colors" title="Edit">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => handleDelete(t.id, e)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#6b7280] hover:text-red-500 transition-colors" title="Delete">
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#e5e7eb] sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-base font-semibold text-navy">
                  {editingId ? 'Edit Template' : 'New Template'}
                </h2>
                {formData.stageKey && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Zap className="w-3 h-3 text-bronze" />
                    <span className="text-xs text-bronze font-medium">Auto-sent on: <strong>{STAGE_LABELS[formData.stageKey]}</strong></span>
                  </div>
                )}
              </div>
              <button onClick={closeForm} className="p-2 rounded-lg hover:bg-[#f3f4f6] text-[#6b7280] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-[#374151] uppercase tracking-wide block mb-1.5">Template Name *</label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Interview Invitation" className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#374151] uppercase tracking-wide block mb-1.5">Type</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full h-9 px-3 text-sm rounded-lg border border-[#e5e7eb] bg-white focus:outline-none focus:ring-1 focus:ring-bronze">
                    {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Stage Link (only for custom / non-stage templates) */}
              {!formData.stageKey && (
                <div>
                  <label className="text-[11px] font-semibold text-[#374151] uppercase tracking-wide block mb-1.5">Link to Stage <span className="text-[#9ca3af] normal-case font-normal">(optional — makes it auto-send)</span></label>
                  <select value={formData.stageKey || ''} onChange={e => setFormData({ ...formData, stageKey: e.target.value })} className="w-full h-9 px-3 text-sm rounded-lg border border-[#e5e7eb] bg-white focus:outline-none focus:ring-1 focus:ring-bronze">
                    <option value="">None (manual use only)</option>
                    {STAGE_KEYS.map(k => <option key={k} value={k}>{STAGE_LABELS[k]}</option>)}
                  </select>
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="text-[11px] font-semibold text-[#374151] uppercase tracking-wide block mb-1.5">Email Subject *</label>
                <Input value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder="e.g., Your Geolabs Application — {{stageLabel}}" className="h-9 text-sm" />
              </div>

              {/* Body */}
              <div>
                <label className="text-[11px] font-semibold text-[#374151] uppercase tracking-wide block mb-1.5">Message Body *</label>
                <textarea
                  value={formData.body}
                  onChange={e => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Write your message to the candidate. The email is automatically wrapped in Geolabs branding — just write the body text here."
                  rows={7}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#e5e7eb] focus:outline-none focus:ring-1 focus:ring-bronze resize-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['{{firstName}}', '{{lastName}}', '{{position}}', '{{stageLabel}}'].map(v => (
                    <code key={v} className="text-[11px] bg-[#f3f4f6] border border-[#e5e7eb] px-1.5 py-0.5 rounded text-[#374151] cursor-pointer hover:bg-bronze/10 hover:border-bronze/30 transition-colors"
                      onClick={() => setFormData(prev => ({ ...prev, body: prev.body + v }))}>
                      {v}
                    </code>
                  ))}
                  <span className="text-[10px] text-[#9ca3af] self-center ml-1">click to insert variable</span>
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="text-[11px] font-semibold text-[#374151] uppercase tracking-wide block mb-1.5">Internal Notes <span className="text-[#9ca3af] normal-case font-normal">(not visible to candidates)</span></label>
                <textarea value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Team notes about when or how to use this template…" rows={2} className="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] focus:outline-none focus:ring-1 focus:ring-bronze resize-none" />
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${formData.isActive ? 'bg-bronze' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-xs font-medium text-[#374151]">Active — send this email automatically</span>
              </label>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-[#e5e7eb] flex items-center justify-between gap-2 sticky bottom-0 bg-white">
              {editingId && (
                <button onClick={(e) => { handleDelete(editingId, e); closeForm(); }} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1.5 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete template
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button onClick={closeForm} variant="outline" className="rounded-lg px-4 h-9 text-sm">Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="rounded-lg px-4 h-9 text-sm bg-bronze hover:bg-bronze-dark text-white">
                  {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />}
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