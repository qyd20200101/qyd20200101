// apps/react-app/src/App.tsx
import { BrowserRouter, Navigate, Route, Routes, Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Layout, Menu, Space, Typography, Tabs, Dropdown } from "antd";
import { useEffect } from "react";
import DashboardPage from "./features/asset/pages/DashboardPage";
import DataManagerPage from "./features/asset/pages/DataManagerPage";
import Designer from './designer/Designer';
import PreviewPage from "./pages/PreviewPage";
import UserManagementPage from "./features/system/pages/UserManagementPage";
import AuditLogPage from "./features/system/pages/AuditLogPage";
import LoginPage from "./features/auth/pages/LoginPage";
import AuthGuard from "./components/AuthGuard";
import { useAuthStore } from "./store/useAuthStore";
import { useTagsViewStore } from "./store/useTagsViewStore";
import { useRouterStore } from "./store/useRouterStore";

const { Header, Content } = Layout;
const { Title } = Typography;

// 路由 meta 配置：path → title
const routeMeta: Record<string, { title: string; name: string }> = {
  '/dashboard': { title: '数据看板', name: 'Dashboard' },
  '/asset': { title: '资产管理', name: 'DataManager' },
  '/designer': { title: '表单设计', name: 'Designer' },
  '/preview': { title: '表单预览', name: 'Preview' },
  '/audit': { title: '审计日志', name: 'AuditLog' },
  '/system': { title: '用户管理', name: 'UserManagement' },
};

function AppLayout({ children }: { children: React.ReactNode }) {
  const clearAuth = useAuthStore(state => state.clearAuth);
  const { visitedViews, cacheViews, addView, delView, delOthersViews, delAllViews } = useTagsViewStore();
  const location = useLocation();
  const navigate = useNavigate();

  // 路由变化时自动添加页签
  useEffect(() => {
    const meta = routeMeta[location.pathname];
    if (meta) {
      addView({ path: location.pathname, title: meta.title, name: meta.name });
    }
  }, [location.pathname]);

  const menuItems = [
    { key: '/dashboard', label: <Link to="/dashboard">数据看板</Link> },
    { key: '/asset', label: <Link to="/asset">资产管理</Link> },
    { key: '/designer', label: <Link to="/designer">表单设计</Link> },
    { key: '/preview', label: <Link to="/preview">表单预览</Link> },
    { key: '/audit', label: <Link to="/audit">审计日志</Link> },
    { key: '/system', label: <Link to="/system">用户管理</Link> },
  ];

  // 页签操作菜单
  const tabContextMenu = (path: string) => ({
    items: [
      { key: 'close', label: '关闭当前' },
      { key: 'closeOthers', label: '关闭其他' },
      { key: 'closeAll', label: '关闭所有' },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'close') {
        const currentIndex = visitedViews.findIndex(v => v.path === path);
        delView(path);
        // 如果关闭的是当前页，跳转到相邻页签
        if (path === location.pathname) {
          const next = visitedViews[currentIndex - 1] || visitedViews[currentIndex + 1];
          if (next) navigate(next.path);
        }
      } else if (key === 'closeOthers') {
        delOthersViews(path);
      } else if (key === 'closeAll') {
        delAllViews();
        navigate('/dashboard');
      }
    },
  });

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Header className="nav-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 50px' }}>
        <Space size="large">
          <Title level={4} style={{ margin: 0, color: '#1677ff', fontWeight: 800 }}>SaaS Admin</Title>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ border: 'none', background: 'transparent', minWidth: 600 }}
          />
        </Space>
        <Button type="primary" danger ghost onClick={() => { clearAuth(); delAllViews(); }} style={{ borderRadius: 8 }}>
          退出登录
        </Button>
      </Header>
      {/* 页签栏 */}
      {visitedViews.length > 0 && (
        <div style={{ background: '#fff', padding: '0 50px', borderBottom: '1px solid #f0f0f0' }}>
          <Tabs
            type="editable-card"
            hideAdd
            activeKey={location.pathname}
            onChange={(key) => navigate(key)}
            onEdit={(key, action) => {
              if (action === 'remove' && typeof key === 'string') {
                delView(key);
                if (key === location.pathname) {
                  const idx = visitedViews.findIndex(v => v.path === key);
                  const next = visitedViews[idx - 1] || visitedViews[idx + 1];
                  if (next) navigate(next.path);
                }
              }
            }}
            items={visitedViews.map(v => ({
              key: v.path,
              label: (
                <Dropdown menu={tabContextMenu(v.path)} trigger={['contextMenu']}>
                  <span>{v.title}</span>
                </Dropdown>
              ),
            }))}
            style={{ marginBottom: 0 }}
          />
        </div>
      )}
      <Content style={{ padding: '24px 50px' }}>
        <div className="fade-in">
          {children}
        </div>
      </Content>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={
          <AuthGuard>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/asset" element={<DataManagerPage />} />
                <Route path="/designer" element={<Designer />} />
                <Route path="/preview" element={<PreviewPage />} />
                <Route path="/audit" element={<AuthGuard requiredRoles={['admin']}><AuditLogPage /></AuthGuard>} />
                <Route path="/system" element={<UserManagementPage />} />
                <Route path="*" element={<div style={{ padding: 24 }}>404 Not Found</div>} />
              </Routes>
            </AppLayout>
          </AuthGuard>
        } />
      </Routes>
    </BrowserRouter>
  );
}
