import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import StarsBackground from './components/StarsBackground';
import CursorGlow from './components/CursorGlow';
import LoadingScreen from './components/LoadingScreen';

import LandingPage from './pages/LandingPage';
import SemesterDashboard from './pages/SemesterDashboard';
import SemesterDetail from './pages/SemesterDetail';
import UploadPage from './pages/UploadPage';
import NotesViewer from './pages/NotesViewer';
import AdminPanel from './pages/AdminPanel';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import FavoritesPage from './pages/FavoritesPage';
import LoginPage from './pages/LoginPage';
import ErrorPage from './pages/ErrorPage';

function App() {
  const [initLoading, setInitLoading] = useState(true);

  if (initLoading) {
    return <LoadingScreen onComplete={() => setInitLoading(false)} />;
  }

  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <StarsBackground />
          <CursorGlow />

          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />

            <div className="flex flex-1 relative">
              <Sidebar />
              
              <main className="flex-1 w-full relative">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/semesters" element={<SemesterDashboard />} />
                  <Route path="/semester/:sem" element={<SemesterDetail />} />
                  <Route path="/upload" element={<UploadPage />} />
                  <Route path="/notes/:id" element={<NotesViewer />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/favorites" element={<FavoritesPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  
                  <Route path="/404" element={<ErrorPage type="404" />} />
                  <Route path="/upload-failed" element={<ErrorPage type="upload-failed" />} />
                  <Route path="/empty-notes" element={<ErrorPage type="empty-notes" />} />
                  <Route path="*" element={<ErrorPage type="404" />} />
                </Routes>
              </main>
            </div>
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
