import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBoxOpen, FaTags, FaCommentDots, FaQuestionCircle,
  FaEnvelopeOpenText, FaImages, FaPlus, FaGlobe, FaBullhorn, FaUserCog, FaUtensils,
} from 'react-icons/fa';
import dashboardService from '../../../services/dashboardService';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

export const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentEnquiries, setRecentEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const { isManager } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [data, activities, enquiries] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecentActivities(),
          dashboardService.getRecentEnquiries(),
        ]);
        setStats(data);
        setRecentActivities(activities);
        setRecentEnquiries(enquiries);
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
            {[...Array(isManager ? 5 : 7)].map((_, i) => (
            <div key={i} className="stat-card-admin" style={{ animation: 'pulse 1.5s infinite ease-in-out', background: '#e2e8f0', height: '106px', border: 'none' }} />
          ))}
        </div>
      </div>
    );
  }

  if (isManager) {
    const hasNoData =
      (stats?.totalProducts || 0) === 0 &&
      (stats?.foodCornerProducts || 0) === 0 &&
      (stats?.activeOffers || 0) === 0 &&
      (stats?.totalEnquiries || 0) === 0 &&
      (stats?.activeAnnouncements || 0) === 0;

    return (
      <div>
        <div className="stats-row">
          <div className="stat-card-admin">
            <div className="stat-card-icon-wrap icon-blue"><FaBoxOpen /></div>
            <div className="stat-card-info">
              <span className="stat-card-value">{stats?.totalProducts || 0}</span>
              <span className="stat-card-label">Total Grocery Products</span>
            </div>
          </div>
          <div className="stat-card-admin">
            <div className="stat-card-icon-wrap icon-teal"><FaUtensils /></div>
            <div className="stat-card-info">
              <span className="stat-card-value">{stats?.foodCornerProducts || 0}</span>
              <span className="stat-card-label">Food Corner Count</span>
            </div>
          </div>
          <div className="stat-card-admin">
            <div className="stat-card-icon-wrap icon-green"><FaTags /></div>
            <div className="stat-card-info">
              <span className="stat-card-value">{stats?.activeOffers || 0}</span>
              <span className="stat-card-label">Active Offers</span>
            </div>
          </div>
          <div className="stat-card-admin">
            <div className="stat-card-icon-wrap icon-red"><FaEnvelopeOpenText /></div>
            <div className="stat-card-info">
              <span className="stat-card-value">{stats?.totalEnquiries || 0}</span>
              <span className="stat-card-label">Customer Enquiries</span>
            </div>
          </div>
          <div className="stat-card-admin">
            <div className="stat-card-icon-wrap icon-orange"><FaBullhorn /></div>
            <div className="stat-card-info">
              <span className="stat-card-value">{stats?.activeAnnouncements || 0}</span>
              <span className="stat-card-label">Announcements</span>
            </div>
          </div>
        </div>

        {hasNoData && (
          <div className="dashboard-panel admin-empty-state" style={{ marginTop: 24 }}>
            <h3>No Data Available</h3>
            <p>Dashboard statistics will appear once products, offers, and enquiries are available.</p>
          </div>
        )}

        <div className="dashboard-panel" style={{ marginTop: 24 }}>
          <h3 className="panel-title">Quick Actions</h3>
          <div className="quick-actions-grid">
            <div className="quick-action-card" onClick={() => navigate('/admin/dashboard/products')}>
              <FaPlus className="quick-action-card-icon" />
              <span>Add Product</span>
            </div>
            <div className="quick-action-card" onClick={() => navigate('/admin/dashboard/products?type=food-corner')}>
              <FaPlus className="quick-action-card-icon" />
              <span>Add Food Corner Item</span>
            </div>
            <div className="quick-action-card" onClick={() => navigate('/admin/dashboard/messages')}>
              <FaEnvelopeOpenText className="quick-action-card-icon" />
              <span>View Enquiries</span>
            </div>
            <div className="quick-action-card" onClick={() => navigate('/admin/dashboard/announcements')}>
              <FaBullhorn className="quick-action-card-icon" />
              <span>Manage Offers</span>
            </div>
          </div>
        </div>

        <div className="dashboard-grid-two-col" style={{ marginTop: 24 }}>
          <div className="dashboard-panel">
            <h3 className="panel-title">Recent Activities</h3>
            <div className="activity-list">
              {recentActivities.length > 0 ? (
                recentActivities.map((item) => (
                  <div key={`${item._id || item.createdAt}-${item.action}`} className="activity-item">
                    <div className="activity-dot" style={{ backgroundColor: '#3b82f6' }} />
                    <div className="activity-text">{item.description}</div>
                    <div className="activity-time">
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '20px 0' }}>No recent activities.</div>
              )}
            </div>
          </div>

          <div className="dashboard-panel">
            <h3 className="panel-title">Recent Enquiries</h3>
            <div className="activity-list">
              {recentEnquiries.length > 0 ? (
                recentEnquiries.map((item, idx) => (
                  <div key={`${item.createdAt}-${idx}`} className="activity-item">
                    <div
                      className="activity-dot"
                      style={{ backgroundColor: item.status === 'Pending' ? '#ef4444' : '#22c55e' }}
                    />
                    <div className="activity-text">{item.customerName}: {item.subject}</div>
                    <div className="activity-time">{item.status}</div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '20px 0' }}>No recent enquiries.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="stats-row">
        <div className="stat-card-admin">
          <div className="stat-card-icon-wrap icon-blue"><FaBoxOpen /></div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats?.totalProducts || 0}</span>
            <span className="stat-card-label">Grocery Products</span>
          </div>
        </div>
        <div className="stat-card-admin">
          <div className="stat-card-icon-wrap icon-teal"><FaUtensils /></div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats?.foodCornerProducts || 0}</span>
            <span className="stat-card-label">Food Corner</span>
          </div>
        </div>
        <div className="stat-card-admin">
          <div className="stat-card-icon-wrap icon-green"><FaTags /></div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats?.totalCategories || 0}</span>
            <span className="stat-card-label">Categories</span>
          </div>
        </div>
        <div className="stat-card-admin">
          <div className="stat-card-icon-wrap icon-purple"><FaCommentDots /></div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats?.totalTestimonials || 0}</span>
            <span className="stat-card-label">Reviews</span>
          </div>
        </div>
        <div className="stat-card-admin">
          <div className="stat-card-icon-wrap icon-orange"><FaQuestionCircle /></div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats?.totalFaqs || 0}</span>
            <span className="stat-card-label">FAQs</span>
          </div>
        </div>
        <div className="stat-card-admin">
          <div className="stat-card-icon-wrap icon-red"><FaEnvelopeOpenText /></div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats?.totalMessages || 0}</span>
            <span className="stat-card-label">Messages</span>
          </div>
        </div>
        <div className="stat-card-admin">
          <div className="stat-card-icon-wrap icon-teal"><FaImages /></div>
          <div className="stat-card-info">
            <span className="stat-card-value">{stats?.activeBanners || 0}</span>
            <span className="stat-card-label">Banners</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-two-col">
        <div className="dashboard-panel">
          <h3 className="panel-title">
            <span>Recent Activity</span>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Live Feed</span>
          </h3>
          <div className="activity-list">
            {stats?.recentActivities?.length > 0 ? (
              stats.recentActivities.map((act) => (
                <div key={act.id} className="activity-item">
                  <div
                    className="activity-dot"
                    style={{
                      backgroundColor:
                        act.type === 'message' ? '#ef4444'
                          : act.type === 'product' ? '#3b82f6'
                            : act.type === 'category' ? '#2ecc71' : '#a855f7',
                    }}
                  />
                  <div className="activity-text">{act.text}</div>
                  <div className="activity-time">{act.time}</div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '20px 0' }}>No recent activities.</div>
            )}
          </div>
        </div>

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
