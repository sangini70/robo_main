import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PostSummary } from '../../types';
import { Edit2, Trash2, ExternalLink, Plus, Search, Filter } from 'lucide-react';
import { getDashboardStats, updateIndexingStatus, fetchAdminPosts, publishStaticContent, deleteAdminPost } from '../../services/adminService';

// Add IndexData type locally if not in types.ts
interface IndexData {
  slug: string;
  google_status: string;
  naver_status: string;
}

export default function AdminPosts() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [indexing, setIndexing] = useState<IndexData[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<PostSummary[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hubFilter, setHubFilter] = useState('all');
  const [flowFilter, setFlowFilter] = useState('all');
  const [indexFilter, setIndexFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const loadData = () => {
    Promise.all([
      fetchAdminPosts(),
      getDashboardStats()
    ]).then(([postsData, statsData]) => {
      setPosts(postsData);
      setIndexing(statsData.indexing || []);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to fetch posts:', err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIndexUpdate = async (slug: string, platform: 'google' | 'naver', currentStatus: string) => {
    const nextStatusMap: Record<string, string> = {
      '미요청': '요청완료',
      '요청완료': '색인확인',
      '색인확인': '미요청'
    };
    const nextStatus = nextStatusMap[currentStatus] || '미요청';
    const success = await updateIndexingStatus(slug, platform, nextStatus);
    if (success) {
      loadData(); // Reload to get synced status
    }
  };

  const handlePublish = async () => {
    if (!confirm('현재의 모든 변경사항(포스트, 시그널 등)을 공개 사이트에 반영하시겠습니까? (JSON 동기화)')) return;
    setPublishing(true);
    try {
      const res = await publishStaticContent();
      alert(res.message);
    } catch (e) {
      alert('출판 실패: 서버 오류');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('정말 이 포스트를 삭제하시겠습니까? (Firestore에서 영구 삭제됩니다)')) return;
    const success = await deleteAdminPost(slug);
    if (success) {
      loadData();
    }
  };

  useEffect(() => {
    const term = search.toLowerCase();
    
    let filtered = posts.map(p => {
      const idx = indexing.find(i => i.slug === p.slug);
      return {
        ...p,
        googleIndexStatus: (idx?.google_status as any) || '미요청',
        naverIndexStatus: (idx?.naver_status as any) || '미요청'
      };
    }).filter(p => 
      p.title.toLowerCase().includes(term) || 
      p.slug.toLowerCase().includes(term) ||
      p.hub.toLowerCase().includes(term)
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (hubFilter !== 'all') {
      filtered = filtered.filter(p => p.hub === hubFilter);
    }

    if (flowFilter !== 'all') {
      filtered = filtered.filter(p => p.flowStep === Number(flowFilter));
    }

    if (indexFilter !== 'all') {
      filtered = filtered.filter(p => p.googleIndexStatus === indexFilter || p.naverIndexStatus === indexFilter);
    }

    setFilteredPosts(filtered as any);
  }, [search, posts, indexing, statusFilter, hubFilter, flowFilter, indexFilter]);

  if (loading) return <div className="p-8 font-black text-gray-400 animate-pulse uppercase tracking-[0.3em]">Synching with Server Engine...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-text-main">Posts</h1>
          <button 
            onClick={handlePublish}
            disabled={publishing}
            className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-green-700 disabled:opacity-50 transition-all shadow-sm"
          >
            {publishing ? 'Publishing...' : 'Publish to Public Site'}
          </button>
        </div>
        <Link to="/admin/new" className="bg-accent text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-md">
          <Plus size={18} /> New Post
        </Link>
      </div>

      <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-gray-50/50 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input 
                type="text" 
                placeholder="Search by title, slug or hub..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border rounded-md shadow-xs">
                <Filter size={14} className="text-text-muted" />
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Filters</span>
              </div>
              
              <select 
                className="bg-white border border-border rounded-md px-3 py-1.5 text-xs font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-accent/20"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">STATE: ALL</option>
                <option value="published">PUBLISHED</option>
                <option value="scheduled">SCHEDULED</option>
                <option value="draft">DRAFT</option>
              </select>

              <select 
                className="bg-white border border-border rounded-md px-3 py-1.5 text-xs font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-accent/20"
                value={hubFilter}
                onChange={(e) => setHubFilter(e.target.value)}
              >
                <option value="all">HUB: ALL</option>
                <option value="exchange-rate">EXCHANGE RATE</option>
                <option value="etf">ETF</option>
              </select>

              <select 
                className="bg-white border border-border rounded-md px-3 py-1.5 text-xs font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-accent/20"
                value={flowFilter}
                onChange={(e) => setFlowFilter(e.target.value)}
              >
                <option value="all">FLOW: ALL</option>
                {[1, 2, 3, 4, 5].map(step => (
                  <option key={step} value={step}>STEP {step}</option>
                ))}
              </select>

              <select 
                className="bg-white border border-border rounded-md px-3 py-1.5 text-xs font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-accent/20"
                value={indexFilter}
                onChange={(e) => setIndexFilter(e.target.value)}
              >
                <option value="all">INDEX: ALL</option>
                <option value="미요청">미요청</option>
                <option value="요청완료">요청완료</option>
                <option value="색인확인">색인확인</option>
              </select>
              
              {(statusFilter !== 'all' || hubFilter !== 'all' || flowFilter !== 'all' || indexFilter !== 'all' || search !== '') && (
                <button 
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setHubFilter('all');
                    setFlowFilter('all');
                    setIndexFilter('all');
                  }}
                  className="text-[10px] font-bold text-accent uppercase hover:underline ml-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-text-muted font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Post Info</th>
                <th className="px-4 py-3">Hub & Flow</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Indexing (G / N)</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPosts.map(post => (
                <tr key={post.slug} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-4 py-4">
                    <div className="font-bold text-text-main line-clamp-1 mb-0.5">{post.title}</div>
                    <div className="text-[11px] text-text-muted font-mono tracking-tight">/{post.slug}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                        {post.hub}
                       </span>
                       <span className="text-[10px] font-bold text-accent">
                         Step {post.flowStep}
                       </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <PostStatusBadge status={post.status} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 font-sans">
                      <IndexingBadge 
                        platform="G"
                        status={post.googleIndexStatus || '미요청'} 
                        onClick={() => handleIndexUpdate(post.slug, 'google', post.googleIndexStatus || '미요청')} 
                      />
                      <IndexingBadge 
                        platform="N"
                        status={post.naverIndexStatus || '미요청'} 
                        onClick={() => handleIndexUpdate(post.slug, 'naver', post.naverIndexStatus || '미요청')}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={`/${post.slug}`} target="_blank" rel="noreferrer" className="p-1.5 text-text-muted hover:text-accent transition-colors" title="View Public">
                        <ExternalLink size={16} />
                      </a>
                      <Link to={`/admin/edit/${post.slug}`} className="p-1.5 text-text-muted hover:text-blue-600 transition-colors" title="Edit">
                        <Edit2 size={16} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(post.slug)}
                        className="p-1.5 text-text-muted hover:text-red-600 transition-colors" 
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPosts.length === 0 && (
            <div className="p-12 text-center text-text-muted text-sm italic">
              No posts found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PostStatusBadge({ status }: { status: string }) {
  const styles = {
    published: 'bg-green-100 text-green-700 border-green-200',
    scheduled: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
  }[status] || 'bg-gray-100 text-gray-700';

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${styles}`}>
      {status}
    </span>
  );
}

function IndexingBadge({ platform, status, onClick }: { platform: string, status: string, onClick?: () => void }) {
  const colors = {
    '미요청': 'bg-gray-100 text-gray-400 border-transparent',
    '요청완료': 'bg-blue-50 text-blue-500 border border-blue-100',
    '색인확인': 'bg-green-50 text-green-600 border border-green-100',
  }[status] || 'bg-gray-100 text-gray-400 border-transparent';

  return (
    <button 
      onClick={onClick}
      className={`w-16 flex items-center justify-between px-1.5 py-0.5 rounded text-[9px] font-black transition-all hover:scale-105 active:scale-95 ${colors}`}
    >
      <span className="opacity-40">{platform}</span>
      <span>{status}</span>
    </button>
  );
}
