import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Upload, FileText, CheckCircle, AlertTriangle, ArrowRight, 
  BookOpen, Layers, X, Plus, Folder, File, Trash2
} from 'lucide-react';

const ALLOWED_EXTS = ['.pdf', '.docx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png'];

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const MAX_WIDTH = 1600;
        const MAX_HEIGHT = 1600;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.7
        );
      };
    };
    reader.onerror = () => resolve(file);
  });
};

const UploadPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  // Topic / folder grouping name (one per batch upload)
  const [topicName, setTopicName] = useState('');
  const [semester, setSemester] = useState('1');
  const [subject, setSubject] = useState('');
  const [unitNumber, setUnitNumber] = useState('1');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  // Multiple files
  const [files, setFiles] = useState([]); // Array of { file, name, error }
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFileIdx, setCurrentFileIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successCount, setSuccessCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const semParam = searchParams.get('semester');
    const subParam = searchParams.get('subject');
    if (semParam) setSemester(semParam);
    if (subParam) setSubject(subParam);
  }, [searchParams]);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6 relative z-20 min-h-[calc(100vh-200px)] flex flex-col justify-center">
        <div className="glass-panel rounded-2xl p-8 border border-white/5 space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-cyan-400" />
          </div>
          <h2 className="font-montserrat text-xl font-bold text-white">Authentication Required</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            You must be signed in to upload notes or contribute to ENotes.
          </p>
          <button
            onClick={() => navigate('/login?redirect=upload')}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Sign In with Gmail</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const validateFile = (f) => {
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) return 'Invalid format (allowed: PDF, DOCX, PPT, Images)';
    if (f.size > 50 * 1024 * 1024) return 'File exceeds 50MB limit';
    return null;
  };

  const addFiles = (newFiles) => {
    setErrorMsg(null);
    const toAdd = [];
    for (const f of newFiles) {
      const err = validateFile(f);
      const isDup = files.some(existing => existing.file.name === f.name && existing.file.size === f.size);
      if (!isDup) {
        toAdd.push({ file: f, name: f.name.replace(/\.[^/.]+$/, ''), error: err });
      }
    }
    setFiles(prev => [...prev, ...toAdd]);
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) addFiles(Array.from(e.target.files));
    e.target.value = ''; // reset so same file can be re-added if needed
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const updateFileName = (idx, val) => {
    setFiles(prev => prev.map((f, i) => i === idx ? { ...f, name: val } : f));
  };

  const validFiles = files.filter(f => !f.error);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) { setErrorMsg('Please select at least one file to upload.'); return; }
    if (!topicName.trim()) { setErrorMsg('Please enter a Topic / Folder Name for this upload.'); return; }
    if (!subject.trim()) { setErrorMsg('Please enter the Subject/Course name.'); return; }

    const errFiles = files.filter(f => f.error);
    if (errFiles.length > 0) { setErrorMsg(`Fix invalid files before uploading: ${errFiles.map(f => f.file.name).join(', ')}`); return; }

    setErrorMsg(null);
    setUploading(true);
    setProgress(0);
    setCurrentFileIdx(0);
    setSuccessCount(0);

    let successfulUploads = 0;
    let completedCount = 0;
    let uploadError = null;

    const uploadPromises = validFiles.map(async (fileObj) => {
      let { file, name } = fileObj;
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      // Compress image notes on-the-fly (dramatically reduces size and speeds up upload)
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        try {
          file = await compressImage(file);
        } catch (compressErr) {
          console.warn('[Upload] Image compression failed, uploading original:', compressErr);
        }
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', name || file.name.replace(/\.[^/.]+$/, ''));
      formData.append('topicGroup', topicName.trim());
      formData.append('subject', subject);
      formData.append('semester', semester);
      formData.append('unitNumber', unitNumber);
      formData.append('description', description);
      formData.append('tags', tags);
      formData.append('fileExt', ext.replace('.', ''));

      try {
        const res = await fetch('/api/notes/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        if (res.ok) {
          successfulUploads++;
        } else {
          const errData = await res.json();
          uploadError = errData.message || 'Upload failed';
        }
      } catch (err) {
        uploadError = err.message || 'Network error';
      } finally {
        completedCount++;
        setProgress(Math.round((completedCount / validFiles.length) * 90));
        setCurrentFileIdx(Math.min(completedCount, validFiles.length - 1));
      }
    });

    await Promise.all(uploadPromises);

    setProgress(100);
    setSuccessCount(successfulUploads);

    setTimeout(() => {
      setUploading(false);
      if (successfulUploads > 0) {
        setDone(true);
      } else {
        setErrorMsg(uploadError || 'Upload failed. Please check your Firebase Storage/Firestore settings.');
      }
    }, 400);
  };

  const resetForm = () => {
    setFiles([]);
    setTopicName('');
    setDescription('');
    setTags('');
    setDone(false);
    setProgress(0);
    setSuccessCount(0);
  };

  const extIcon = (ext) => {
    const e = (ext || '').toLowerCase();
    if (e.includes('pdf')) return '📄';
    if (e.includes('ppt')) return '📊';
    if (e.includes('doc')) return '📝';
    if (['jpg','jpeg','png'].includes(e)) return '🖼️';
    return '📁';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 min-h-[calc(100vh-65px)] pb-24 md:pb-8 relative z-20">
      
      <div>
        <h1 className="font-montserrat text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
          <Upload className="h-8 w-8 text-cyan-400" />
          <span>Upload Study Files</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload multiple files at once under a single topic/folder name.
        </p>
      </div>

      {done ? (
        /* Success Screen */
        <div className="glass-panel rounded-2xl p-8 border border-emerald-500/20 text-center space-y-6 animate-in fade-in duration-300">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-montserrat text-xl font-bold text-white">
              {successCount} / {validFiles.length} File{validFiles.length !== 1 ? 's' : ''} Uploaded!
            </h2>
            <p className="text-sm text-slate-400">
              Your files are now grouped under <span className="text-cyan-400 font-semibold">"{topicName}"</span> in <span className="text-white font-semibold">{subject}</span>.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(`/semester/${semester}`)}
              className="px-6 py-2.5 rounded-lg bg-slate-800 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
            >
              View in Semester
            </button>
            <button
              onClick={resetForm}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 text-xs font-bold text-white"
            >
              Upload More Files
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all flex flex-col items-center justify-center gap-3 ${
              dragOver
                ? 'border-cyan-400 bg-cyan-500/5 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                : files.length > 0
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-white/10 hover:border-cyan-500/30 bg-slate-900/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
              multiple
            />
            <div className={`h-12 w-12 rounded-full flex items-center justify-center border transition-all ${
              files.length > 0 ? 'bg-emerald-500/10 border-emerald-400/20 text-emerald-400' : 'bg-slate-800 border-white/5 text-slate-400'
            }`}>
              <Upload className="h-6 w-6" />
            </div>
            {files.length > 0 ? (
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">{files.length} file{files.length !== 1 ? 's' : ''} selected</p>
                <p className="text-xs text-emerald-400">Click or drag to add more files</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Drag & drop files here, or <span className="text-cyan-400">browse</span></p>
                <p className="text-xs text-slate-500">Supports PDF, DOCX, PPT, Images • Up to 50MB each • Multiple files allowed</p>
              </div>
            )}
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
              <div className="px-5 py-3 bg-slate-800/50 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Folder className="h-4 w-4 text-amber-400" /> 
                  Files in this upload ({files.length})
                </span>
                <button
                  type="button"
                  onClick={() => { setFiles([]); }}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold"
                >
                  Clear All
                </button>
              </div>
              <div className="divide-y divide-white/5 max-h-[260px] overflow-y-auto">
                {files.map((item, idx) => {
                  const rawExt = item.file.name.substring(item.file.name.lastIndexOf('.')).toLowerCase();
                  return (
                    <div key={idx} className={`flex items-center gap-3 px-4 py-3 ${item.error ? 'bg-rose-950/20' : ''}`}>
                      <span className="text-xl flex-shrink-0">{extIcon(rawExt.replace('.',''))}</span>
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => updateFileName(idx, e.target.value)}
                          className="w-full bg-transparent text-sm text-white font-medium focus:outline-none border-b border-transparent focus:border-cyan-400/50 pb-0.5 transition-colors truncate"
                          title="Click to rename this file's display title"
                        />
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                          <span>{rawExt.toUpperCase().replace('.','')}</span>
                          <span>•</span>
                          <span>{(item.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                          {item.error && <span className="text-rose-400 ml-1">⚠ {item.error}</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="flex-shrink-0 p-1.5 rounded-lg bg-slate-800 border border-white/5 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Metadata form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 glass-panel rounded-2xl p-6 border border-white/5">
            {/* Topic/folder name — spans full width, most prominent */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Folder className="h-3.5 w-3.5 text-amber-400" /> Topic / Folder Name *
              </label>
              <input
                type="text"
                value={topicName}
                onChange={e => setTopicName(e.target.value)}
                placeholder="e.g. Unit 1 – Logic Gates, Chapter 3 Notes, Midterm Prep..."
                required
                className="w-full rounded-xl bg-slate-800/80 border border-white/10 px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500">All files above will be grouped under this topic name as a folder.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Semester *</label>
              <select
                value={semester}
                onChange={e => setSemester(e.target.value)}
                required
                className="w-full rounded-xl bg-slate-800/80 border border-white/10 px-4 py-2.5 text-sm text-slate-300 focus:border-cyan-400 focus:outline-none"
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                ))}
                <option value="9">GOVT EXAM</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" /> Unit Number *
              </label>
              <select
                value={unitNumber}
                onChange={e => setUnitNumber(e.target.value)}
                required
                className="w-full rounded-xl bg-slate-800/80 border border-white/10 px-4 py-2.5 text-sm text-slate-300 focus:border-cyan-400 focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map(u => (
                  <option key={u} value={u}>Unit {u}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Subject / Course Name *
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Engineering Mathematics, Data Structures..."
                required
                className="w-full rounded-xl bg-slate-800/80 border border-white/10 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Tags (comma separated)</label>
              <input
                type="text"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="e.g. Logic, ECE, Formulas"
                className="w-full rounded-xl bg-slate-800/80 border border-white/10 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief overview of topics covered in these notes..."
                rows="3"
                className="w-full rounded-xl bg-slate-800/80 border border-white/10 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Upload progress */}
          {uploading && (
            <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-4">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-cyan-400 animate-spin" />
                  Uploading file {currentFileIdx + 1} of {validFiles.length}…
                </span>
                <span className="font-mono font-bold text-cyan-400">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 via-cyan-500 to-sky-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {!uploading && (
            <button
              type="submit"
              className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] text-white transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
            >
              <Upload className="h-5 w-5" />
              Upload {validFiles.length > 0 ? `${validFiles.length} File${validFiles.length !== 1 ? 's' : ''}` : 'Files'} to Topic Folder
            </button>
          )}
        </form>
      )}
    </div>
  );
};

export default UploadPage;
