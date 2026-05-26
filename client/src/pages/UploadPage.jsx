import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Upload, FileText, CheckCircle, AlertTriangle, ArrowRight, BookOpen, Layers } from 'lucide-react';

const UploadPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [semester, setSemester] = useState('1');
  const [subject, setSubject] = useState('');
  const [unitNumber, setUnitNumber] = useState('1');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [success, setSuccess] = useState(false);

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
            You must be signed in with your Google Mail account to upload notes or contribute to ENotes.
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

  const validateFile = (selectedFile) => {
    setErrorMsg(null);
    const allowed = ['.pdf', '.docx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png'];
    const extension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowed.includes(extension)) {
      setErrorMsg('Invalid file format. Only PDF, DOCX, PPT, and Images are supported.');
      return false;
    }
    
    if (selectedFile.size > 50 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 50MB limit.');
      return false;
    }

    return true;
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && validateFile(selected)) {
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const selected = e.dataTransfer.files[0];
    if (selected && validateFile(selected)) {
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please select or drop a file to upload.');
      return;
    }
    if (!title || !subject || !semester || !unitNumber) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setErrorMsg(null);
    setUploading(true);
    setProgress(15);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('subject', subject);
    formData.append('semester', semester);
    formData.append('unitNumber', unitNumber);
    formData.append('description', description);
    formData.append('tags', tags);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 150);

    try {
      const res = await fetch('/api/notes/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'File upload failed');
      }

      setTimeout(() => {
        setUploading(false);
        setSuccess(true);
      }, 400);

    } catch (err) {
      clearInterval(progressInterval);
      setUploading(false);
      setProgress(0);
      setErrorMsg(err.message || 'Server error uploading file.');
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setTags('');
    setSuccess(false);
    setProgress(0);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 min-h-[calc(100vh-65px)] pb-24 md:pb-8 relative z-20">
      
      <div>
        <h1 className="font-montserrat text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
          <Upload className="h-8 w-8 text-cyan-400 animate-bounce" />
          <span>Upload Study Notes</span>
        </h1>
        <p className="text-sm text-slate-400">
          Share your study guides, course summaries, slides, or diagrams.
        </p>
      </div>

      {success ? (
        <div className="glass-panel rounded-2xl p-8 border border-cyan-400/20 text-center space-y-6 animate-in fade-in duration-300">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
            <CheckCircle className="h-8 w-8 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h2 className="font-montserrat text-xl font-bold text-white">Upload Completed Successfully!</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Thank you for contributing! Your notes are now indexed. You have received contributor score and points.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/profile')}
              className="px-6 py-2.5 rounded-lg bg-slate-800 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
            >
              View In Profile
            </button>
            <button
              onClick={resetForm}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 text-xs font-bold text-white"
            >
              Upload Another File
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all flex flex-col items-center justify-center gap-3 ${
              dragOver
                ? 'border-cyan-400 bg-cyan-500/5 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                : file
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-white/10 hover:border-cyan-500/30 bg-slate-900/40'
            }`}
            onClick={triggerFileSelect}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
            />

            <div className={`h-12 w-12 rounded-full flex items-center justify-center border transition-all ${
              file ? 'bg-emerald-500/10 border-emerald-400/20 text-emerald-400' : 'bg-slate-800 border-white/5 text-slate-400'
            }`}>
              <Upload className="h-6 w-6" />
            </div>

            {file ? (
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">{file.name}</p>
                <p className="text-xs text-emerald-400 font-mono">{(file.size / (1024 * 1024)).toFixed(2)} MB • File Validated</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Drag & drop your files here, or <span className="text-cyan-400 hover:text-cyan-300">browse</span></p>
                <p className="text-xs text-slate-500">Supports PDF, DOCX, PPT slides, and Images up to 50MB</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 glass-panel rounded-2xl p-6 border border-white/5">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Note Title / Topic Name *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Logic Circuits Implementation"
                required
                className="w-full rounded-xl bg-slate-800/80 border border-white/10 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                Semester *
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
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
                <Layers className="h-3.5 w-3.5" /> Unit Number (1-5) *
              </label>
              <select
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                required
                className="w-full rounded-xl bg-slate-800/80 border border-white/10 px-4 py-2.5 text-sm text-slate-300 focus:border-cyan-400 focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map((u) => (
                  <option key={u} value={u}>Unit {u}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                Subject/Course Name *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Semester 1 Course 1"
                required
                className="w-full rounded-xl bg-slate-800/80 border border-white/10 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. Logic, ECE, Formulas"
                className="w-full rounded-xl bg-slate-800/80 border border-white/10 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Description / Notes Overview
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write a brief overview of the topics covered in these notes..."
                rows="3"
                className="w-full rounded-xl bg-slate-800/80 border border-white/10 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none resize-none"
              ></textarea>
            </div>
          </div>

          {uploading && (
            <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-4">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-cyan-400 animate-spin" /> Compiling & Syncing notes...</span>
                <span className="font-mono font-bold text-cyan-400">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 via-cyan-500 to-sky-400 rounded-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {!uploading && (
            <button
              type="submit"
              className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] text-white transition-all hover:scale-[1.01]"
            >
              Submit Upload To Index
            </button>
          )}
        </form>
      )}

    </div>
  );
};

export default UploadPage;
