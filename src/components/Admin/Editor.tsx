import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PostDetail, PostStatus, IndexStatus } from '../../types';
import { Save, Eye, Trash2, ArrowLeft, RefreshCw, Copy, Download } from 'lucide-react';
import { saveAdminPost, fetchAdminPosts } from '../../services/adminService';

interface Props {
  isNew?: boolean;
}

export default function AdminEditor({ isNew }: Props) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!isNew);
  const [post, setPost] = useState<Partial<PostDetail>>({
    title: '',
    slug: '',
    content: '',
    hub: 'exchange-rate',
    flowStep: 1,
    status: 'draft',
    publishAt: new Date().toISOString(),
    summary: '',
    googleIndexStatus: '미요청',
    naverIndexStatus: '미요청',
    category: 'exchange-rate',
    language: 'ko',
    tags: [],
    seoTitle: '',
    seoDescription: '',
    related_slugs: []
  });

  const [jsonOutput, setJsonOutput] = useState<{ posts?: string, detail?: string, flow?: string } | null>(null);

  useEffect(() => {
    if (!isNew && slug) {
      fetchAdminPosts().then(posts => {
        const found = posts.find((p: any) => p.slug === slug);
        if (found) {
          setPost(found);
          setLoading(false);
        } else {
          // Fallback to static JSON if not in Firestore yet
          fetch(`/data/detail/${slug}.json`)
            .then(res => res.json())
            .then(data => {
              setPost(data);
              setLoading(false);
            })
            .catch(err => {
              console.error('Failed to fetch post detail:', err);
              setLoading(false);
            });
        }
      });
    }
  }, [isNew, slug]);

  const handleSave = async () => {
    if (!post.slug || !post.title) {
      alert('Title and Slug are required');
      return;
    }

    setLoading(true);
    try {
      const success = await saveAdminPost(post);
      if (success) {
        alert('Saved to Firestore! Use the "Publish" button on the list page to update the public site.');
        navigate('/admin/posts');
      } else {
        alert('Failed to save');
      }
    } catch (e) {
      alert('Error saving post');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-text-muted">Loading editor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 border border-border rounded-lg shadow-sm sticky top-[72px] z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/posts')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-text-main">{isNew ? 'New Post' : 'Edit Post'}</h1>
            <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase">{post.hub} · Step {post.flowStep}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-primary text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-md disabled:opacity-50"
          >
            <Save size={18} /> {loading ? 'Saving...' : 'Save to Firestore'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Content */}
          <div className="bg-white border border-border rounded-lg shadow-sm">
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Article Title</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 border border-border rounded-lg text-lg font-bold focus:bg-white transition-all outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent"
                  placeholder="Enter title here..."
                  value={post.title}
                  onChange={(e) => setPost({...post, title: e.target.value})}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-bold text-text-muted uppercase tracking-widest">Main Content (Markdown/HTML)</label>
                  <div className="flex gap-2">
                    <button className="text-[10px] font-bold text-accent py-0.5 px-2 border border-accent/20 rounded hover:bg-accent/5">HTML Mode</button>
                  </div>
                </div>
                <textarea 
                  className="w-full px-4 py-3 bg-gray-50 border border-border rounded-lg font-mono text-sm leading-relaxed min-h-[500px] focus:bg-white transition-all outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent"
                  placeholder="Start writing..."
                  value={post.content}
                  onChange={(e) => setPost({...post, content: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Search/SEO */}
          <div className="bg-white border border-border rounded-lg shadow-sm">
             <div className="p-4 border-b border-border font-bold text-text-main text-sm">SEO & Metadata</div>
             <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">SEO Title (Optional)</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 bg-gray-50 border border-border rounded-md text-sm outline-none focus:border-accent"
                    value={post.seoTitle}
                    onChange={(e) => setPost({...post, seoTitle: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">SEO Description / Meta Summary</label>
                  <textarea 
                    className="w-full px-3 py-2 bg-gray-50 border border-border rounded-md text-sm outline-none focus:border-accent min-h-[80px]"
                    value={post.seoDescription || post.summary}
                    onChange={(e) => setPost({...post, seoDescription: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">Short Summary (List view)</label>
                  <textarea 
                    className="w-full px-3 py-2 bg-gray-50 border border-border rounded-md text-sm outline-none focus:border-accent h-16"
                    value={post.summary}
                    onChange={(e) => setPost({...post, summary: e.target.value})}
                  />
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Post Settings */}
          <div className="bg-white border border-border rounded-lg shadow-sm">
             <div className="p-4 border-b border-border font-bold text-text-main text-sm">Publish Settings</div>
             <div className="p-5 space-y-4">
               <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">Status</label>
                  <select 
                    className="w-full px-3 py-2 bg-gray-50 border border-border rounded-md text-sm font-medium"
                    value={post.status}
                    onChange={(e) => setPost({...post, status: e.target.value as PostStatus})}
                  >
                    <option value="draft">임시저장 (Draft)</option>
                    <option value="scheduled">예약발행 (Scheduled)</option>
                    <option value="published">발행됨 (Published)</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">Publish At (KST)</label>
                  <input 
                    type="datetime-local" 
                    className="w-full px-3 py-2 bg-gray-50 border border-border rounded-md text-sm"
                    value={post.publishAt?.slice(0, 16)}
                    onChange={(e) => setPost({...post, publishAt: new Date(e.target.value).toISOString()})}
                  />
               </div>
               <div className="pt-2">
                 <button className="w-full py-2 border border-border rounded-lg text-xs font-bold text-text-main flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                   <Eye size={14} /> Preview
                 </button>
               </div>
             </div>
          </div>

          {/* Structure */}
          <div className="bg-white border border-border rounded-lg shadow-sm">
             <div className="p-4 border-b border-border font-bold text-text-main text-sm">Flow Structure</div>
             <div className="p-5 space-y-4">
               <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">Slug (URL)</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 bg-gray-50 border border-border rounded-md text-sm font-mono"
                    value={post.slug}
                    onChange={(e) => setPost({...post, slug: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">HUB</label>
                  <select 
                    className="w-full px-3 py-2 bg-gray-50 border border-border rounded-md text-sm"
                    value={post.hub}
                    onChange={(e) => setPost({...post, hub: e.target.value})}
                  >
                    <option value="exchange-rate">환율 (Exchange Rate)</option>
                    <option value="etf">ETF</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">FLOW Step</label>
                  <select 
                    className="w-full px-3 py-2 bg-gray-50 border border-border rounded-md text-sm"
                    value={post.flowStep}
                    onChange={(e) => setPost({...post, flowStep: Number(e.target.value)})}
                  >
                    {[1, 2, 3, 4, 5].map(s => (
                      <option key={s} value={s}>Step {s}</option>
                    ))}
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">Thumbnail URL</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 bg-gray-50 border border-border rounded-md text-sm"
                    placeholder="https://..."
                    value={post.thumbnail}
                    onChange={(e) => setPost({...post, thumbnail: e.target.value})}
                  />
               </div>
             </div>
          </div>

          {/* Indexing */}
          <div className="bg-[#edf2f7] rounded-lg p-5">
             <div className="font-bold text-[11px] text-text-muted uppercase mb-3">Index Status</div>
             <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className="block text-[9px] font-bold text-text-muted uppercase mb-1">Google</label>
                 <select 
                   className="w-full px-2 py-1 bg-white border border-border rounded text-[10px]"
                   value={post.googleIndexStatus}
                   onChange={(e) => setPost({...post, googleIndexStatus: e.target.value as IndexStatus})}
                 >
                   <option value="미요청">미요청</option>
                   <option value="요청완료">요청완료</option>
                   <option value="색인확인">색인확인</option>
                 </select>
               </div>
               <div>
                 <label className="block text-[9px] font-bold text-text-muted uppercase mb-1">Naver</label>
                 <select 
                   className="w-full px-2 py-1 bg-white border border-border rounded text-[10px]"
                   value={post.naverIndexStatus}
                   onChange={(e) => setPost({...post, naverIndexStatus: e.target.value as IndexStatus})}
                 >
                   <option value="미요청">미요청</option>
                   <option value="요청완료">요청완료</option>
                   <option value="색인확인">색인확인</option>
                 </select>
               </div>
             </div>
          </div>
        </div>
      </div>

      {jsonOutput && (
        <div className="bg-black text-green-400 p-6 rounded-lg font-mono text-xs overflow-x-auto space-y-4 shadow-2xl">
          <div>
            <div className="flex justify-between items-center text-white/50 mb-2 font-sans font-bold">
              <span>DETAIL JSON: /public/data/detail/{post.slug}.json</span>
              <button onClick={() => navigator.clipboard.writeText(jsonOutput.detail!)} className="flex items-center gap-1 hover:text-white"><Copy size={12} /> Copy</button>
            </div>
            <pre className="p-4 bg-white/5 rounded">{jsonOutput.detail}</pre>
          </div>
          <div className="pt-4 border-t border-white/10 italic text-white/30 font-sans">
            Note: In a true GitHub flow, you would push these JSON changes to trigger Vercel deployment.
          </div>
        </div>
      )}
    </div>
  );
}
