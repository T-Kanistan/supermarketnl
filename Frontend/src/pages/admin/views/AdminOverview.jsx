import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBoxOpen, FaTags, FaCommentDots, FaQuestionCircle, 
  FaEnvelopeOpenText, FaImages, FaPlus, FaGlobe, FaBullhorn, FaUserCog
} from 'react-icons/fa';
import dashboardService from '../../../services/dashboardService';
import { useToast } from '../../../context/ToastContext';

export const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
        addToast('Failed to load dashboard metrics', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [addToast]);

  if (loading) {
    return (
      <div className="stats-loading-skeleton">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="stat-card-admin" style={{ animation: 'pulse 1.5s infinite ease-in-out', background: '#e2e8f0', height: '106px', border: 'none' }}></div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
          <div className="dashboard-panel" style={{ height: '300px', background: '#e2e8f0', animation: 'pulse 1.5s infinite ease-in-out', border: 'none' }}></div>
          <div className="dashboard-panel" style={{ height: '300px', background: '#e2e8f0', animation: 'pulse 1.5s infinite ease-in-out', border: 'none' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Top Stats Cards Row */}
      <div className="stats-row">
        <div className="stat-card-admin">
          <div className="stat-card-icon-wrap icon-blue">
            <FaBoxOpen />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats?.totalProducts || 0}</span>
            <span className="stat-card-label">Products</span>
          </div>
        </div>

        <div className="stat-card-admin">
          <div className="stat-card-icon-wrap icon-green">
            <FaTags />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats?.totalCategories || 0}</span>
            <span className="stat-card-label">Categories</span>
          </div>
        </div>

        <div className="stat-card-admin">
          <div className="stat-card-icon-wrap icon-purple">
            <FaCommentDots />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats?.totalTestimonials || 0}</span>
            <span className="stat-card-label">Reviews</span>
          </div>
        </div>

        <div className="stat-card-admin">
          <div className="stat-card-icon-wrap icon-orange">
            <FaQuestionCircle />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats?.totalFaqs || 0}</span>
            <span className="stat-card-label">FAQs</span>
          </div>
        </div>

        <div className="stat-card-admin">
          <div className="stat-card-icon-wrap icon-red">
            <FaEnvelopeOpenText />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats?.totalMessages || 0}</span>
            <span className="stat-card-label">Messages</span>
          </div>
        </div>

        <div className="stat-card-admin">
          <div className="stat-card-icon-wrap icon-teal">
            <FaImages />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats?.activeBanners || 0}</span>
            <span className="stat-card-label">Banners</span>
          </div>
        </div>
      </div>

      {/* Grid: Recent Activity & Quick Actions */}
      <div className="dashboard-grid-two-col">
        {/* Recent Activity Panel */}
        <div className="dashboard-panel">
          <h3 className="panel-title">
            <span>Recent Activity</span>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Live Feed</span>
          </h3>
          <div className="activity-list">
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((act) => (
                <div key={act.id} className="activity-item">
                  <div className="activity-dot" style={{ 
                    backgroundColor: act.type === 'message' ? '#ef4444' : 
                                     act.type === 'product' ? '#3b82f6' : 
                                     act.type === 'category' ? '#2ecc71' : '#a855f7'
                  }}></div>
                  <div className="activity-text">{act.text}</div>
                  <div className="activity-time">{act.time}</div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '20px 0' }}>No recent activities.</div>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="dashboard-panel">
          <h3 className="panel-title">Quick Actions</h3>
          <div className="quick-actions-grid">
            <div className="quick-action-card" onClick={() => navigate('/admin/dashboard/products')}>
              <FaPlus className="quick-action-card-icon" />
              <span>Add Product</span>
            </div>
            
            <div className="quick-action-card" onClick={() => navigate('/admin/dashboard/site-settings')}>
              <FaGlobe className="quick-action-card-icon" />
              <span>CMS Branding</span>
            </div>

            <div className="quick-action-card" onClick={() => navigate('/admin/dashboard/messages')}>
              <FaEnvelopeOpenText className="quick-action-card-icon" />
              <span>View Enquiries</span>
            </div>

            <div className="quick-action-card" onClick={() => navigate('/admin/dashboard/announcements')}>
              <FaBullhorn className="quick-action-card-icon" />
              <span>New Announcement</span>
            </div>
            
            <div className="quick-action-card" onClick={() => navigate('/admin/dashboard/profile')}>
              <FaUserCog className="quick-action-card-icon" />
              <span>Account settings</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
