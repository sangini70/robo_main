import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PostSummary } from '../../types';
import { FileText, CheckCircle, Clock, Eye, BarChart3, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { getDashboardStats } from '../../services/adminService';

interface DBStat {
  slug: string;
  views: number;
  impressions: number;
  clicks: number;
  updatedAt: string;
}

interface IndexData {
  slug: string;
  google_status: string;
  naver_status: string;
}

export default function AdminDashboard() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [dbStats, setDbStats] = useState<DBStat[]>([]);
  const [indexing, setIndexing] = useState<IndexData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/data/posts.json').then(res => res.json()),
      getDashboardStats()
    ]).then(([postsData, data]) => {
      setPosts(postsData);
      setDbStats(data.stats || []);
      setIndexing(data.indexing || []);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to fetch dashboard data:', err);
      setLoading(false);
    });
  }, []);

  const getCTR = (clicks: number, impressions: number) => {
    if (!impressions) return 0;
    return (clicks / impressions) * 100;
  };

  const mergedPosts = posts.map(p => {
    const stat = dbStats.find(s => s.slug === p.slug) || { views: 0, impressions: 0, clicks: 0 };
    const idx = indexing.find(i => i.slug === p.slug);
    return {
      ...p,
      views: stat.views,
      impressions: stat.impressions,
      clicks: stat.clicks,
      ctr: getCTR(stat.clicks, stat.impressions),
      googleStatus: idx?.google_status || '미요청',
      naverStatus: idx?.naver_status || '미요청'
    };
  });

  const unindexedCount = mergedPosts.filter(p => 
    p.status === 'published' && 
    (p.googleStatus === '미요청' || p.naverStatus === '미요청')
  ).length;

  const aggregateStats = {
    total: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    draft: posts.filter(p => p.status === 'draft').length,
    totalViews: dbStats.reduce((acc, s) => acc + s.views, 0),
    avgCtr: getCTR(
      dbStats.reduce((acc, s) => acc + s.clicks, 0),
      dbStats.reduce((acc, s) => acc + s.impressions, 0)
    ),
    unindexed: unindexedCount
  };

  if (loading) return <div className="p-8 font-black text-gray-400 animate-pulse uppercase tracking-[0.3em]">Synching with Server Engine...</div>;

  const topViews = [...mergedPosts].sort((a, b) => b.views - a.views).slice(0, 5);
  const lowCtr = mergedPosts.filter(p => p.impressions > 10).sort((a, b) => a.ctr - b.ctr).slice(0, 5);
  const gems = mergedPosts.filter(p => p.impressions > 0 && p.views < 100).sort((a, b) => b.ctr - a.ctr).slice(0, 5);
  const upcoming = posts.filter(p => p.status === 'scheduled' && new Date(p.publishAt) > new Date())
    .sort((a, b) => new Date(a.publishAt).getTime() - new Date(b.publishAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-text-main tracking-tighter uppercase">Operations Intel</h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (confirm('Database 백업을 실행하시겠습니까?')) {
                fetch('/api/admin/backup', { method: 'POST' }).then(() => alert('백업 완료 (backups 폴더 확인)'));
              }
            }}
            className="text-[10px] font-bold text-gray-500 hover:text-primary transition-colors uppercase tracking-widest"
          >
            Manual Backup
          </button>
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">Real-time Stats Active</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <StatCard icon={<FileText size={18} />} label="Documents" value={aggregateStats.total} color="bg-blue-600" />
        <StatCard icon={<CheckCircle size={18} />} label="Live" value={aggregateStats.published} color="bg-emerald-600" />
        <StatCard icon={<Clock size={18} />} label="Pending" value={aggregateStats.scheduled} color="bg-amber-600" />
        <StatCard icon={<BarChart3 size={18} />} label="Total Views" value={aggregateStats.totalViews} color="bg-indigo-600" />
        <StatCard icon={<Target size={18} />} label="Avg CTR" value={`${aggregateStats.avgCtr.toFixed(1)}%`} color="bg-rose-600" />
        <StatCard icon={<TrendingUp size={18} />} label="SEO Alert" value={aggregateStats.unindexed} color="bg-orange-600" desc="미색인 글" />
        <StatCard icon={<Eye size={18} />} label="Drafts" value={aggregateStats.draft} color="bg-slate-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Box title="최근 실적 요약" icon={<BarChart3 size={16} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="text-[10px] font-black text-text-muted uppercase mb-2">Top Performer (Views)</div>
              {topViews[0] ? (
                <div>
                  <div className="text-sm font-black text-text-main line-clamp-1 mb-1">{topViews[0].title}</div>
                  <div className="text-xl font-black text-primary">{topViews[0].views} <span className="text-xs text-gray-400">VIEWS</span></div>
                </div>
              ) : <div className="text-xs text-gray-400">데이터 없음</div>}
            </div>
            <div className="p-4 bg-emerald-50/50 rounded-xl">
              <div className="text-[10px] font-black text-text-muted uppercase mb-2">High Efficiency (CTR)</div>
              {gems[0] ? (
                <div>
                  <div className="text-sm font-black text-emerald-800 line-clamp-1 mb-1">{gems[0].title}</div>
                  <div className="text-xl font-black text-emerald-600">{gems[0].ctr.toFixed(1)}% <span className="text-xs text-emerald-400">CTR</span></div>
                </div>
              ) : <div className="text-xs text-gray-400">데이터 없음</div>}
            </div>
          </div>
        </Box>

        <Box title="예약 발행 예정" icon={<Clock size={16} />}>
           <div className="space-y-3">
            {upcoming.length > 0 ? upcoming.map(p => (
              <div key={p.slug} className="flex items-center justify-between p-3 bg-amber-50/30 border border-amber-100/50 rounded-xl">
                <div className="truncate pr-4 flex-1">
                  <div className="text-xs font-black text-amber-900 truncate uppercase">{p.title}</div>
                  <div className="text-[9px] text-amber-600 font-bold uppercase">{p.publishAt.replace('T', ' ').slice(0, 16)}</div>
                </div>
                <div className="text-[10px] font-black text-amber-500 uppercase tracking-tighter">WAITING</div>
              </div>
            )) : <div className="text-center py-6 text-xs text-gray-400 font-bold uppercase tracking-widest">발행 대기 중인 글이 없습니다</div>}
          </div>
        </Box>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Popular List */}
        <Box title="인기 분석글 (Views Top 5)" icon={<TrendingUp size={16} />}>
          <div className="space-y-3">
            {topViews.map(p => (
              <div key={p.slug} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="truncate pr-4 flex-1">
                  <div className="text-xs font-black text-text-main truncate uppercase">{p.title}</div>
                  <div className="text-[9px] text-text-muted font-bold uppercase">{p.hub}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-primary">{p.views}</div>
                  <div className="text-[9px] font-bold text-text-muted">VIEWS</div>
                </div>
              </div>
            ))}
          </div>
        </Box>

        {/* Low CTR List */}
        <Box title="최적화 필요 (Low CTR)" icon={<TrendingDown size={16} />}>
          <div className="space-y-3">
            {lowCtr.map(p => (
              <div key={p.slug} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl hover:bg-red-50 transition-colors">
                <div className="truncate pr-4 flex-1">
                  <div className="text-xs font-black text-text-main truncate uppercase">{p.title}</div>
                  <div className="text-[9px] text-text-muted font-bold uppercase">EXP: {p.impressions}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-red-600">{p.ctr.toFixed(1)}%</div>
                  <div className="text-[9px] font-bold text-red-400">CTR</div>
                </div>
              </div>
            ))}
          </div>
        </Box>

        {/* Hidden Gems */}
        <Box title="성과 우수 (High CTR)" icon={<Target size={16} />}>
          <div className="space-y-3">
            {gems.map(p => (
              <div key={p.slug} className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl hover:bg-emerald-50 transition-colors">
                <div className="truncate pr-4 flex-1">
                  <div className="text-xs font-black text-text-main truncate uppercase">{p.title}</div>
                  <div className="text-[9px] text-text-muted font-bold uppercase">VIEWS: {p.views}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-emerald-600">{p.ctr.toFixed(1)}%</div>
                  <div className="text-[9px] font-bold text-emerald-400">CTR</div>
                </div>
              </div>
            ))}
          </div>
        </Box>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border flex justify-between items-center bg-gray-50/50">
          <h2 className="font-black text-text-main uppercase text-sm tracking-tight">Post Operations Central</h2>
          <Link to="/admin/posts" className="text-[10px] bg-primary text-white font-black px-3 py-1 rounded-full uppercase tracking-widest hover:bg-black transition-colors">View All Archive</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-white text-text-muted font-black uppercase text-[10px] tracking-widest border-b border-border">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Hub</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">SEO (G/N)</th>
                <th className="px-6 py-4 text-right">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mergedPosts.slice(0, 10).map(post => (
                <tr key={post.slug} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-black text-text-main group-hover:text-primary transition-colors uppercase tracking-tight line-clamp-1">{post.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold text-text-muted uppercase bg-gray-100 px-2 py-0.5 rounded-full">{post.hub}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      post.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                      post.status === 'scheduled' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                       <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${post.googleStatus === '색인확인' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>G</span>
                       <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${post.naverStatus === '색인확인' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>N</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <div className="text-xs font-black text-text-main">{post.views} <span className="text-[9px] text-text-muted">V</span></div>
                      <div className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">{post.ctr.toFixed(1)}% CTR</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, desc }: { icon: React.ReactNode, label: string, value: string | number, color: string, desc?: string }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`${color} text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/10`}>
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">{label}</div>
        <div className="text-2xl font-black text-text-main tracking-tighter">{value}</div>
        {desc && <div className="text-[9px] text-gray-400 font-bold uppercase mt-1">{desc}</div>}
      </div>
    </div>
  );
}

function Box({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6 text-primary">
        {icon}
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">{title}</h3>
      </div>
      {children}
    </div>
  );
}
