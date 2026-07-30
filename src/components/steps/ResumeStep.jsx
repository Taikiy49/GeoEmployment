import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FormSection from '../app/FormSection';
import NavigationButtons from '../app/NavigationButtons';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];
const MAX_SIZE = 2.5 * 1024 * 1024;

export default function ResumeStep({ formData, setFormData, onNext, onBack }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  // If resume was already uploaded (persisted in formData), start in success state
  const [status, setStatus] = useState(formData.resumeFileUrl ? 'success' : 'idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type) && !f.name.match(/\.(pdf|doc|docx|txt)$/i)) {
      setErrorMsg('Unsupported file type. Please upload PDF, DOC, DOCX, or TXT.');
      setStatus('error');
      return;
    }
    if (f.size > MAX_SIZE) {
      setErrorMsg('File exceeds 5 MB limit.');
      setStatus('error');
      return;
    }
    setFile(f);
    setStatus('idle');
    setErrorMsg('');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  }, [handleFile]);

  const handleUploadAndParse = async () => {
    if (!file) return;
    setStatus('uploading');
    setErrorMsg('');

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('We could not read this resume.'));
        reader.readAsDataURL(file);
      });
      const content = String(dataUrl).split(',')[1];
      setFormData(prev => ({
        ...prev,
        resumeFileUrl: `attached:${file.name}`,
        resumeFileName: file.name,
        resumeAttachment: {
          filename: file.name,
          content,
          type: file.type || 'application/octet-stream',
        },
      }));
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to attach resume.');
      setStatus('error');
    }
  };

  return (
    <div>
      <FormSection
        title="Resume"
        description="Attach a PDF, DOC, DOCX, or TXT resume. It will be delivered securely with your application."
      >
        {/* Upload area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer
            ${dragOver
              ? 'border-[#A65F2A] bg-[#F8F0E9]'
              : file
                ? 'border-success bg-success-soft'
                : 'border-[#cbd5e1] bg-[#f8fafc] hover:border-[#A65F2A] hover:bg-[#FBF5F0]'
            }
          `}
          onClick={() => document.getElementById('resume-input').click()}
        >
          <input
            id="resume-input"
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          {file || formData.resumeFileUrl ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className={`w-8 h-8 ${status === 'success' ? 'text-success' : 'text-[#A65F2A]'}`} />
              <div className="text-left">
                <p className="text-sm font-medium text-[#0f172a]">{file ? file.name : formData.resumeFileName || 'Resume uploaded'}</p>
                <p className="text-[10px] text-[#64748b]">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : status === 'success' ? 'Previously uploaded & analyzed' : 'Ready to analyze'}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setStatus('idle');
                  setFormData(prev => ({ ...prev, resumeFileUrl: '', resumeFileName: '', resumeAttachment: null }));
                }}
                className="ml-2 p-1 rounded-full hover:bg-[#f1f5f9]"
              >
                <X className="w-4 h-4 text-[#64748b]" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-[#94a3b8] mx-auto mb-3" />
              <p className="text-sm font-medium text-[#334155]">
                Drag & drop your resume here
              </p>
              <p className="text-xs text-[#64748b] mt-1">
                or click to browse · PDF, DOC, DOCX, TXT · Max 2.5 MB
              </p>
            </>
          )}
        </div>

        {/* Upload button */}
        {file && status !== 'success' && !formData.resumeFileUrl && (
          <div className="mt-4 flex justify-center">
            <Button
             onClick={handleUploadAndParse}
             disabled={status === 'uploading'}
             className="rounded-lg px-3 h-9 text-sm bg-[#A65F2A] hover:bg-[#8A4A22] text-white font-medium"
            >
              {status === 'uploading' && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {status === 'uploading' ? 'Attaching...' : 'Attach Resume'}
            </Button>
          </div>
        )}

        {/* Status messages */}
        {status === 'error' && (
          <div className="mt-4 flex items-start gap-2 p-4 rounded-lg bg-red-50 border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{errorMsg}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-4 flex items-start gap-2 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-emerald-800">
              Resume attached and ready to send with your application.
            </p>
          </div>
        )}
      </FormSection>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
