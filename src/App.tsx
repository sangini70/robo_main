/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ChevronRight, ChevronLeft, ArrowRight, Home, Info, Mail, Shield } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PostSummary, PostDetail, FlowIndex } from './types';

// --- Components ---

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 bg-primary text-white h-16 shadow-md">
      <div className="max-w-5xl mx-auto px-6 h-full">
        <div className="flex justify-between h-full items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="logo text-xl font-extrabold tracking-tight flex items-center gap-2">
              ROBO-ADVISOR <span className="bg-accent px-2 py-0.5 rounded text-sm font-bold">TALAR-PORT</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-white border-b-2 border-white py-1' : 'text-white/80 hover:text-white'}`}>Home</Link>
            <Link to="/category/exchange-rate" className={`text-sm font-medium transition-colors ${location.pathname.includes('/category/exchange-rate') ? 'text-white border-b-2 border-white py-1' : 'text-white/80 hover:text-white'}`}>Exchange Rate</Link>
            <Link to="/category/etf" className={`text-sm font-medium transition-colors ${location.pathname.includes('/category/etf') ? 'text-white border-b-2 border-white py-1' : 'text-white/80 hover:text-white'}`}>ETF</Link>
            <Link to="/about" className={`text-sm font-medium transition-colors ${location.pathname === '/about' ? 'text-white border-b-2 border-white py-1' : 'text-white/80 hover:text-white'}`}>About</Link>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[11px] font-bold text-[#48bb78]">
            <div className="w-1.5 h-1.5 bg-[#48bb78] rounded-full"></div>
            STATIC JSON MODE
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white/80 hover:text-white">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-primary border-t border-white/10 overflow-hidden"
          >
            <div className="px-6 pt-2 pb-6 space-y-4">
              <Link to="/" onClick={() => setIsOpen(false)} className="block text-lg font-medium text-white">Home</Link>
              <Link to="/category/exchange-rate" onClick={() => setIsOpen(false)} className="block text-lg font-medium text-white">Exchange Rate</Link>
              <Link to="/category/etf" onClick={() => setIsOpen(false)} className="block text-lg font-medium text-white">ETF</Link>
              <Link to="/about" onClick={() => setIsOpen(false)} className="block text-lg font-medium text-white">About</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-white border-t border-border h-12 flex items-center justify-center gap-6 text-xs text-text-muted mt-auto">
    <Link to="/privacy" className="hover:text-text-main">Privacy Policy</Link>
    <Link to="/contact" className="hover:text-text-main">Terms of Service</Link>
    <span>© 2026 Robo-Advisor Rebuild (Talar-Port)</span>
  </footer>
);

// --- Sidebar Components ---

const SidebarLeft = ({ flow }: { flow: FlowIndex | null }) => {
  return (
    <aside className="hidden lg:flex flex-col gap-4 w-[240px]">
      <div className="widget-title">Execution Flow</div>
      <div className="bg-white border border-border rounded-lg p-4 flex flex-col gap-2">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-none text-[13px]">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${step === 1 ? 'bg-accent text-white' : 'bg-[#edf2f7] text-secondary'}`}>
              {step.toString().padStart(2, '0')}
            </div>
            <span className={step === 1 ? 'font-bold' : 'text-secondary'}>
              {step === 1 && 'Asset Allocation'}
              {step === 2 && 'Risk Assessment'}
              {step === 3 && 'Backtesting Rules'}
              {step === 4 && 'Rebalancing Logic'}
              {step === 5 && 'Live Monitoring'}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 border border-dashed border-border rounded-lg text-[11px] text-text-muted leading-relaxed">
        <strong className="text-text-main">System Notice:</strong><br />
        No Database connection.<br />
        Content fetched from <code>posts.json</code> via static hosting.
      </div>
    </aside>
  );
};

const SidebarRight = () => {
  return (
    <aside className="hidden lg:flex flex-col gap-6 w-[240px]">
      <div>
        <div className="widget-title">Tracks</div>
        <div className="flex flex-col gap-1">
          <Link to="/category/exchange-rate" className="flex justify-between items-center p-2 text-sm text-secondary bg-white/50 hover:bg-[#edf2f7] rounded-md transition-colors">
            Exchange Rate <span className="bg-border px-1.5 py-0.5 rounded-full text-[10px] font-bold">12</span>
          </Link>
          <Link to="/category/etf" className="flex justify-between items-center p-2 text-sm text-secondary bg-white/50 hover:bg-[#edf2f7] rounded-md transition-colors">
            ETF <span className="bg-border px-1.5 py-0.5 rounded-full text-[10px] font-bold">8</span>
          </Link>
        </div>
      </div>

      <div className="bg-[#edf2f7] rounded-lg p-4">
        <div className="widget-title">Infrastructure</div>
        <div className="text-[12px] leading-relaxed text-secondary space-y-1">
          <div>• Git-Vercel Flow</div>
          <div>• Slug Preservation</div>
          <div>• JSON Detail Fetching</div>
          <div>• No DB / No Firebase</div>
        </div>
      </div>
    </aside>
  );
};

// --- Pages ---

const HomePage = () => {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [flow, setFlow] = useState<FlowIndex | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/data/posts.json').then(res => res.json()),
      fetch('/data/flow-index.json').then(res => res.json())
    ])
      .then(([postsData, flowData]) => {
        setPosts(postsData.filter((p: PostSummary) => p.status === 'published'));
        setFlow(flowData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-20 text-center">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[240px_1fr_240px] gap-6">
      <SidebarLeft flow={flow} />

      <main className="flex flex-col gap-8">
        {/* Track Entry (최우선) */}
        <section>
          <div className="widget-title">Track Entry</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.keys(flow || {}).map(track => (
              <Link key={track} to={`/category/${track}`} className="p-6 bg-primary text-white rounded-lg hover:bg-secondary transition-colors group">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Track</div>
                <div className="text-xl font-bold flex items-center justify-between">
                  {track.toUpperCase()} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Step 1 진입 영역 */}
        <section>
          <div className="widget-title">Start Your Journey (Step 1)</div>
          <div className="grid grid-cols-1 gap-4">
            {posts.filter(p => p.step === 1).map(post => (
              <Link key={post.slug} to={`/${post.slug}`} className="flex items-center p-4 bg-white border border-border rounded-lg hover:border-accent transition-all group">
                <div className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-bold mr-4">1</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-text-main group-hover:text-accent transition-colors">{post.title}</h3>
                  <p className="text-xs text-text-muted">{post.description}</p>
                </div>
                <ChevronRight size={18} className="text-border group-hover:text-accent transition-colors" />
              </Link>
            ))}
          </div>
        </section>

        {/* 최신 글 (보조 블록) */}
        <section>
          <div className="widget-title">Recent Insights</div>
          <div className="flex flex-col gap-4">
            {posts.slice(0, 3).map((post) => (
              <article key={post.slug} className="bg-white border border-border rounded-lg p-4 flex gap-4 transition-colors hover:border-accent group">
                <Link to={`/${post.slug}`} className="flex gap-4 w-full">
                  <div className="w-[100px] h-[66px] bg-border rounded overflow-hidden flex-shrink-0">
                    <img
                      src={post.thumbnail || 'https://picsum.photos/seed/finance/100/66'}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="text-[10px] text-accent font-bold uppercase mb-0.5">
                      {post.track} · Step {post.step}
                    </div>
                    <h2 className="text-[16px] font-bold text-text-main leading-tight mb-1 group-hover:text-accent transition-colors">
                      {post.title}
                    </h2>
                    <div className="text-[11px] text-text-muted">
                      {post.publishDate}
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>

      <SidebarRight />
    </div>
  );
};

const DetailPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [flow, setFlow] = useState<FlowIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [prefetched, setPrefetched] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    Promise.all([
      fetch(`/data/detail/${slug}.json`).then(res => res.json()),
      fetch('/data/posts.json').then(res => res.json()),
      fetch('/data/flow-index.json').then(res => res.json())
    ])
      .then(([postData, postsData, flowData]) => {
        setPost(postData);
        setPosts(postsData);
        setFlow(flowData);
        setLoading(false);
        setPrefetched(null);
      })
      .catch(err => {
        console.error('Failed to fetch detail:', err);
        setLoading(false);
      });
  }, [slug]);

  // Calculate prev/next
  const trackFlow = flow?.[post?.track || ''];
  let prevSlug = post?.prev_slug || null;
  let nextSlug = post?.next_slug || null;

  if (trackFlow && post && !prevSlug && !nextSlug) {
    const currentStepKey = `step${post.step}`;
    const prevStepKey = `step${post.step - 1}`;
    const nextStepKey = `step${post.step + 1}`;

    const currentStepSlugs = trackFlow[currentStepKey] || [];
    const currentIndex = currentStepSlugs.indexOf(post.slug);

    if (currentIndex > 0) prevSlug = currentStepSlugs[currentIndex - 1];
    else if (trackFlow[prevStepKey]?.length > 0) prevSlug = trackFlow[prevStepKey][trackFlow[prevStepKey].length - 1];

    if (currentIndex < currentStepSlugs.length - 1) nextSlug = currentStepSlugs[currentIndex + 1];
    else if (trackFlow[nextStepKey]?.length > 0) nextSlug = trackFlow[nextStepKey][0];
  }

  // Prefetch logic at 80% scroll
  useEffect(() => {
    if (!nextSlug || prefetched === nextSlug) return;

    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight;
      const threshold = document.documentElement.scrollHeight * 0.8;
      if (scrollPos > threshold) {
        fetch(`/data/detail/${nextSlug}.json`);
        setPrefetched(nextSlug);
        console.log(`Prefetched: ${nextSlug}`);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [nextSlug, prefetched]);

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-20 text-center">Loading...</div>;
  if (!post) return <div className="max-w-5xl mx-auto px-4 py-20 text-center">Post not found.</div>;

  // Related logic: 1. same track, 2. same step, 3. manual
  let relatedPosts = posts.filter(p => p.slug !== post.slug);
  if (post.related_slugs) {
    relatedPosts = posts.filter(p => post.related_slugs?.includes(p.slug));
  } else {
    relatedPosts = relatedPosts
      .sort((a, b) => {
        if (a.track === post.track && b.track !== post.track) return -1;
        if (a.track !== post.track && b.track === post.track) return 1;
        if (a.step === post.step && b.step !== post.step) return -1;
        if (a.step !== post.step && b.step === post.step) return 1;
        return 0;
      })
      .slice(0, 4);
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[240px_1fr_240px] gap-6">
      <SidebarLeft flow={flow} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-border rounded-lg p-8 relative"
      >
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Link to={`/category/${post.track}`} className="flex items-center text-[11px] font-bold text-accent uppercase hover:underline">
              <ChevronLeft size={12} className="mr-1" /> Back to {post.track}
            </Link>
            <span className="text-[11px] font-bold text-white bg-primary px-2 py-0.5 rounded">
              Step {post.step}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-text-main leading-tight mb-4">
            {post.title}
          </h1>
          <div className="text-sm text-text-muted">
            {post.publishDate}
          </div>
        </header>

        {post.thumbnail && (
          <div className="mb-8 rounded-lg overflow-hidden border border-border">
            <img src={post.thumbnail} alt={post.title} className="w-full h-auto" referrerPolicy="no-referrer" />
          </div>
        )}

        <div className="prose prose-sm prose-gray max-w-none mb-12">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>

        {/* Related Posts */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="widget-title">Related Insights</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedPosts.slice(0, 4).map(related => (
              <Link key={related.slug} to={`/${related.slug}`} className="group block bg-gray-50 border border-border rounded-lg p-3 hover:border-accent transition-colors">
                <div className="aspect-video rounded overflow-hidden mb-3">
                  <img src={related.thumbnail} alt={related.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                </div>
                <h4 className="text-sm font-bold text-text-main group-hover:text-accent transition-colors line-clamp-2">{related.title}</h4>
              </Link>
            ))}
          </div>
        </div>

        {/* Flow Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-8 border-t border-border">
          {prevSlug ? (
            <Link to={`/${prevSlug}`} className="group p-4 bg-gray-50 border border-border rounded-lg hover:bg-gray-100 transition-colors text-left flex items-center gap-3">
              <ChevronLeft size={16} className="text-text-muted" />
              <div>
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Previous</div>
                <div className="text-sm font-bold text-text-main group-hover:text-accent line-clamp-1">이전 단계</div>
              </div>
            </Link>
          ) : <div />}

          {nextSlug ? (
            <Link to={`/${nextSlug}`} className="group p-4 bg-primary border border-primary rounded-lg hover:bg-secondary transition-colors text-right flex items-center justify-end gap-3">
              <div>
                <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Next</div>
                <div className="text-sm font-bold text-white line-clamp-1">다음 단계</div>
              </div>
              <ChevronRight size={16} className="text-white" />
            </Link>
          ) : <div />}
        </div>
      </motion.div>

      <SidebarRight />
    </div>
  );
};

const CategoryPage = () => {
  const { track } = useParams();
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/posts.json')
      .then(res => res.json())
      .then(data => {
        setPosts(data.filter((p: PostSummary) => p.track === track && p.status === 'published'));
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch category posts:', err);
        setLoading(false);
      });
  }, [track]);

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-20 text-center">Loading...</div>;

  const steps = [1, 2, 3, 4, 5];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[240px_1fr_240px] gap-6">
      <SidebarLeft flow={null} />

      <main className="flex flex-col gap-8">
        <header className="mb-4">
          <div className="widget-title">{track?.toUpperCase()} Track</div>
          <p className="text-sm text-text-muted">이 트랙의 5단계 Flow를 따라 학습하세요.</p>
        </header>

        <div className="flex flex-col gap-10">
          {steps.map(step => {
            const stepPosts = posts.filter(p => p.step === step);
            if (stepPosts.length === 0) return null;

            return (
              <div key={step}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {step}
                  </div>
                  <h2 className="text-lg font-bold text-text-main uppercase tracking-tight">
                    Step {step}: {step === 1 && '입문'}
                    {step === 2 && '이해'}
                    {step === 3 && '비교'}
                    {step === 4 && '판단'}
                    {step === 5 && '실행'}
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {stepPosts.map(post => (
                    <Link key={post.slug} to={`/${post.slug}`} className="flex items-center p-4 bg-white border border-border rounded-lg hover:border-accent transition-all group">
                      <div className="flex-1">
                        <h3 className="font-bold text-base text-text-main group-hover:text-accent transition-colors">{post.title}</h3>
                        <p className="text-xs text-text-muted">{post.description}</p>
                      </div>
                      <ChevronRight size={16} className="text-border group-hover:text-accent transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <SidebarRight />
    </div>
  );
};

const StaticPage = ({ title, content }: { title: string, content: string }) => (
  <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[240px_1fr_240px] gap-6">
    <SidebarLeft flow={null} />
    <div className="bg-white border border-border rounded-lg p-8">
      <h1 className="text-3xl font-bold mb-8">{title}</h1>
      <div className="prose prose-sm prose-gray max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
    <SidebarRight />
  </div>
);

// --- Main App ---

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-bg-color font-sans text-text-main selection:bg-accent selection:text-white">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<StaticPage title="About" content="딸라포트 로보어드바이저는 복잡한 금융 데이터를 누구나 이해하기 쉬운 5단계 Flow 구조로 제공하는 서비스입니다." />} />
            <Route path="/contact" element={<StaticPage title="Contact" content="문의사항이 있으시면 luganopizza@gmail.com으로 연락주시기 바랍니다." />} />
            <Route path="/privacy" element={<StaticPage title="Privacy Policy" content="본 서비스는 사용자의 개인정보를 소중히 다루며, 관련 법규를 준수합니다." />} />
            <Route path="/category/:track" element={<CategoryPage />} />
            <Route path="/:slug" element={<DetailPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
