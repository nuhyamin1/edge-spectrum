import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ClockIcon,
  PencilSquareIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import axios from '../../utils/axios';
import Layout from './Layout';
import 'react-quill/dist/quill.snow.css';
import './MaterialView.css';

const formatMaterialDate = (date) => {
  if (!date) return 'Recently added';

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(date));
};

const getReadingTime = (html = '') => {
  const plainText = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
};

const MaterialView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [material, setMaterial] = useState(null);

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const response = await axios.get(`/api/materials/${id}`);
        const content = response.data.content.replace(
          /src="\/uploads\//g,
          `src="${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/`
        );

        setMaterial({ ...response.data, content });
      } catch (error) {
        toast.error('Failed to load material');
        navigate('/dashboard');
      }
    };

    fetchMaterial();
  }, [id, navigate]);

  const readingTime = useMemo(
    () => getReadingTime(material?.content),
    [material?.content]
  );

  const materialsPath = user?.role === 'teacher'
    ? '/dashboard/materials'
    : '/dashboard/student/materials';

  if (!material) {
    return (
      <Layout userType={user?.role}>
        <div className="material-reader-loading" role="status" aria-label="Loading material">
          <span className="material-reader-loading__spinner" />
          <span>Preparing your lesson...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userType={user?.role}>
      <main className="material-reader">
        <nav className="material-reader__toolbar" aria-label="Material actions">
          <button
            type="button"
            onClick={() => navigate(materialsPath)}
            className="material-reader__back-button"
          >
            <ArrowLeftIcon aria-hidden="true" />
            Back to materials
          </button>

          {user?.role === 'teacher' && (
            <button
              type="button"
              onClick={() => navigate(`/dashboard/edit-material/${material._id}`)}
              className="material-reader__edit-button"
            >
              <PencilSquareIcon aria-hidden="true" />
              Edit material
            </button>
          )}
        </nav>

        <header className="material-reader__hero">
          <div className="material-reader__hero-mark" aria-hidden="true">
            <BookOpenIcon />
          </div>
          <div className="material-reader__hero-content">
            <span className="material-reader__subject">{material.subject}</span>
            <h1>{material.title}</h1>
            <p>{material.description}</p>
            <div className="material-reader__hero-meta">
              <span>
                <UserCircleIcon aria-hidden="true" />
                {material.createdBy?.name || 'PF Speaking Master'}
              </span>
              <span>
                <CalendarDaysIcon aria-hidden="true" />
                {formatMaterialDate(material.updatedAt || material.createdAt)}
              </span>
              <span>
                <ClockIcon aria-hidden="true" />
                {readingTime} min read
              </span>
            </div>
          </div>
        </header>

        <div className="material-reader__layout">
          <aside className="material-reader__aside" aria-label="Lesson details">
            <div className="material-reader__aside-heading">
              <BookOpenIcon aria-hidden="true" />
              <span>Lesson details</span>
            </div>
            <dl>
              <div>
                <dt>Subject</dt>
                <dd>{material.subject}</dd>
              </div>
              <div>
                <dt>Estimated reading</dt>
                <dd>{readingTime} {readingTime === 1 ? 'minute' : 'minutes'}</dd>
              </div>
              <div>
                <dt>Prepared by</dt>
                <dd>{material.createdBy?.name || 'PF Speaking Master'}</dd>
              </div>
            </dl>
            <div className="material-reader__aside-note">
              <span>Tip</span>
              Read at your own pace and pause to practise each example aloud.
            </div>
          </aside>

          <article className="material-reader__article">
            <div className="material-reader__article-label">
              <span>Lesson content</span>
              <span aria-hidden="true" />
            </div>
            <div
              className="ql-editor material-content"
              dangerouslySetInnerHTML={{ __html: material.content }}
            />
          </article>
        </div>
      </main>
    </Layout>
  );
};

export default MaterialView;
