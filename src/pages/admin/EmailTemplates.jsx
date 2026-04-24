import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Edit, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminLayout from '../../components/admin/AdminLayout';

const STAGE_KEYS = ['under_review', 'phone_screen', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'];
const STAGE_LABELS = {
  under_review: 'Under Review', phone_screen: 'Phone Screen', interview: 'Interview',
  offer: 'Offer Extended', hired: 'Hired', rejected: 'Not Selected', withdrawn: 'Withdrawn',
};
const STAGE_COLORS = {
  under_review: 'bg-blue-50 text-blue-700 border-blue-100',
  phone_screen: 'bg-purple-50 text-purple-700 border-purple-100',
  interview: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  offer: 'bg-green-50 text-green-700 border-green-100',
  hired: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejected: 'bg-red-50 text-red-700 border-red-100',
  withdrawn: 'bg-gray-50 text-gray-600 border-gray-200',
};

const TYPE_LABELS = {
  stage_update: 'Stage Update', interview_invitation: 'Interview Invitation',
  rejection: 'Rejection', offer: 'Offer', general: 'General',
};
const TYPE_COLORS = {
  stage_update: 'bg-bronze/10 text-bronze',
  interview_invitation: 'bg-blue-50 text-blue-700',
  rejection: 'bg-red-50 text-red-700',
  offer: 'bg-green-50 text-green-700',
  general: 'bg-gray-50 text-gray-700',
};

const EMPTY_FORM = { name: '', stageKey: '', type: 'general', subject: '', body: '', isActive: true, notes: '' };

export default function EmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    base44.entities.EmailTemplate.list('-created_date', 100).then(t => {
      setTemplates(t);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const stageTemplateMap = {};
  templates.forEach(t => { if (t.stageKey) stageTemplateMap[t.stageKey] = t; });

  const otherTemplates = templates.filter(t => !t.stageKey && (
    !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.subject?.toLowerCase().includes(search.toLowerCase())
  ));

  const openForm = (template = null) => {
    setFormData(template ? { ...template } : { ...EMPTY_FORM });
    setEditingId(template?.id || null);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setFormData(null); setEditingId(null); };

  const handleSave = async () => {
    if (!formData.name || !formData.subject || !formData.body) return alert('Please fill in all required fields');
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

  const handleDelete = async (id) => {
    if (confirm('Delete this template?')) { await base44.entities.EmailTemplate.delete(id); load(); }
  };

  const openStageTemplate = (stageKey) => {
    const existing = stageTemplateMap[stageKey];
    if (existing) {
      openForm(existing);
    } else {
      openForm({
        ...EMPTY_FORM,
        name: `${STAGE_LABELS[stageKey]} Email`,
        stageKey,
        type: 'stage_update',
        subject: `Your Geolabs Application — ${STAGE_LABELS[stageKey]}`,
        body: '',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-navy">Email Templates</h1>
            <p className="text-sm text-[#6b7280] mt-0.5">Customize the emails candidates receive at each stage</p>
          </div>
          <Button onClick={() => openForm()} className="rounded-full px-5 h-9 text-sm bg-bronze hover:bg-bronze-dark text-white">
            <Plus className="w-4 h-4 mr-1.5" /> New Template
          </Button>
        </div>

        {/* Stage Templates */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-bronze" />
            <h2 className="text-sm font-semibold text-navy">Automatic Stage Emails</h2>
          </div>
          <p className="text-xs text-[#6b7280] mb-4">These emails are sent automatically when you move a candidate to each stage. Click to customize.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {STAGE_KEYS.map(stageKey => {
              const tmpl = stageTemplateMap[stageKey];
              return (
                <button
                  key={stageKey}
                  onClick={() => openStageTemplate(stageKey)}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[#e5e7eb] hover:border-bronze/40 hover:bg-[#fdf7f1] transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${STAGE_COLORS[stageKey]}`}>
                      {STAGE_LABELS[stageKey]}
                    </span>
                    <span className="text-xs text-[#6b7280] truncate">
                      {tmpl ? tmpl.subject : <span className="italic text-[#9ca3af]">Using default</span>}
                    </span>
                  </div>
                  <span className={`text-[10px] font-medium whitespace-nowrap ${tmpl ? 'text-bronze' : 'text-[#9ca3af]'}`}>
                    {tmpl ? 'Custom ✓' : 'Edit →'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Other Templates */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-navy">Other Templates</h2>
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af]" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="pl-8 h-8 text-xs" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-4 border-bronze/30 border-t-bronze rounded-full animate-spin" />
              </div>
            ) : otherTemplates.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-[#9ca3af]">No custom templates yet. Create one above.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">Name</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide hidden sm:table-cell">Type</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide hidden md:table-cell">Subject</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {otherTemplates.map(t => (
                    <tr key={t.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="px-4 py-3 font-medium text-navy text-xs">{t.name}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[t.type] || TYPE_COLORS.general}`}>
                          {TYPE_LABELS[t.type] || t.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#374151] hidden md:table-cell text-xs truncate max-w-xs">{t.subject}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openForm(t)} className="p-1.5 rounded hover:bg-[#f3f4f6] text-[#6b7280] hover:text-navy transition-colors">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded hover:bg-[#f3f4f6] text-[#6b7280] hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && formData && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#e5e7eb] sticky top-0 bg-white z-10">
              <h2 className="text-base font-semibold text-navy">
                {editingId ? 'Edit Template' : 'New Template'}
              </h2>
              {formData.stageKey && (
                <div className="mt-1 flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-bronze" />
                  <span className="text-xs text-bronze font-medium">Auto-sent when candidate moves to: <strong>{STAGE_LABELS[formData.stageKey]}</strong></span>
                </div>
              )}
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-medium text-[#374151] block mb-1">Template Name *</label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Interview Invitation" className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#374151] block mb-1">Type *</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full h-9 px-3 text-sm rounded-lg border border-[#e5e7eb] bg-white">
                    <option value="stage_update">Stage Update</option>
                    <option value="interview_invitation">Interview Invitation</option>
                    <option value="rejection">Rejection</option>
                    <option value="offer">Offer</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>

              {!formData.stageKey && (
                <div>
                  <label className="text-[11px] font-medium text-[#374151] block mb-1">Linked Stage (optional)</label>
                  <select value={formData.stageKey || ''} onChange={e => setFormData({ ...formData, stageKey: e.target.value })} className="w-full h-9 px-3 text-sm rounded-lg border border-[#e5e7eb] bg-white">
                    <option value="">None (manual use only)</option>
                    {STAGE_KEYS.map(k => <option key={k} value={k}>{STAGE_LABELS[k]}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[11px] font-medium text-[#374151] block mb-1">Email Subject *</label>
                <Input value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder="e.g., Your Geolabs Application — {{stageLabel}}" className="h-9 text-sm" />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#374151] block mb-1">Message Body *</label>
                <textarea
                  value={formData.body}
                  onChange={e => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Write the message to the candidate. The email will be automatically formatted with your Geolabs branding. Use {{firstName}}, {{lastName}}, {{position}}, {{stageLabel}} as variables."
                  rows={7}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#e5e7eb] focus:outline-none focus:ring-1 focus:ring-bronze resize-none"
                />
                <p className="text-[10px] text-[#9ca3af] mt-1.5">
                  Variables: <code className="bg-[#f3f4f6] px-1 rounded">{"{{firstName}}"}</code> <code className="bg-[#f3f4f6] px-1 rounded">{"{{lastName}}"}</code> <code className="bg-[#f3f4f6] px-1 rounded">{"{{position}}"}</code> <code className="bg-[#f3f4f6] px-1 rounded">{"{{stageLabel}}"}</code> · The email is automatically wrapped in Geolabs branding — just write the message text.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#374151] block mb-1">Internal Notes</label>
                <textarea value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Notes for your team (not visible to candidates)" rows={2} className="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] focus:outline-none focus:ring-1 focus:ring-bronze resize-none" />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-[#d1d5db]" />
                <label htmlFor="isActive" className="text-[11px] font-medium text-[#374151]">Active (used automatically)</label>
              </div>
            </div>

            <div className="p-6 border-t border-[#e5e7eb] flex justify-end gap-2">
              <Button onClick={closeForm} variant="outline" className="rounded-lg px-4 h-9 text-sm">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="rounded-lg px-4 h-9 text-sm bg-bronze hover:bg-bronze-dark text-white">
                {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />}
                Save Template
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}