/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronRight, ArrowRight, BookOpen, Target, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Helmet } from 'react-helmet-async';
import { PostSummary, PostDetail, FlowIndex, MarketSignal } from './types';
import AdminPage from './pages/AdminPage';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminPosts from './pages/Admin/Posts';
import AdminNew, { AdminEdit } from './pages/Admin/NewPost';
import AdminSettings from './pages/Admin/Settings';
import AdminSignals from './pages/Admin/Signals';
import AdminLogin from './pages/Admin/Login';
import { MainLayout } from './layouts/MainLayout';
import { checkAuth } from './services/adminService';
import { trackView, trackClick, trackImpression } from './services/trackService';

// --- Auth Protected Component ---
const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    checkAuth().then(setIsAuth);
  }, [location.pathname]);

  if (isAuth === null) return null;
  if (isAuth === false) return <AdminLogin />;
  
  return <>{children}</>;
};

// --- Utils ---
const isVisible = (post: PostSummary) => {
  if (post.status === 'published') return true;
  if (post.status === 'scheduled') {
    return new Date().getTime() >= new Date(post.publishAt).getTime();
  }
  return false;
};

// --- Unified Components ---

const GlobalSignalSection = ({ signals, posts }: { signals: MarketSignal[], posts: PostSummary[] }) => {
  const resolveLink = (signal: MarketSignal) => {
    if (signal.linked_slug) return `/${signal.linked_slug}`;
    
    if (signal.linked_hub && signal.linked_flow_step) {
      const target = posts.find(p => p.hub === signal.linked_hub && p.flowStep === signal.linked_flow_step);
      if (target) return `/${target.slug}`;
    }
    
    if (signal.linked_hub) {
      const fallback = posts.find(p => p.hub === signal.linked_hub && p.flowStep === 1);
      if (fallback) return `/${fallback.slug}`;
      return `/hub/${signal.linked_hub}`;
    }
    
    return '/';
  };

  const activeSignals = signals
    .filter(s => s.status === 'active')
    .sort((a, b) => a.order - b.order)
    .slice(0, 3);

  if (activeSignals.length === 0) return null;

  return (
    <section id="global-signal" className="max-w-5xl mx-auto w-full px-6 py-20 scroll-mt-24">
      <div className="flex items-center gap-3 mb-12">
        <div className="h-px bg-gray-100 flex-1"></div>
        <div className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] px-4">Market Perspective</div>
        <div className="h-px bg-gray-100 flex-1"></div>
      </div>
      
      <div className={`grid grid-cols-1 ${activeSignals.length > 1 ? 'md:grid-cols-2 lg:grid-cols-3' : 'max-w-2xl mx-auto'} gap-8`}>
        {activeSignals.map((signal) => (
          <motion.div 
            key={signal.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm hover:shadow-xl transition-all flex flex-col group"
          >
            <div className="mb-6">
              <div className="text-[10px] font-black text-accent uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span>
                Input Signal
              </div>
              <h3 className="text-2xl font-black text-gray-900 leading-tight mb-4 group-hover:text-primary transition-colors">
                {signal.title}
              </h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed mb-6">
                {signal.summary}
              </p>
            </div>

            <div className="flex-1 border-t border-gray-50 pt-6 mb-8">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Core Variables</div>
              <ul className="space-y-3">
                {signal.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-[13px] font-bold text-gray-700">
                    <span className="w-1 h-1 bg-gray-300 rounded-full mt-2"></span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>

            <Link 
              to={resolveLink(signal)}
              onClick={() => trackClick(`signal-${signal.id}`)}
              className="w-full inline-flex items-center justify-between bg-gray-50 text-gray-900 font-black py-4 px-6 rounded-2xl hover:bg-primary hover:text-white transition-all group active:scale-95"
            >
              지금 흐름 이해하기 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const HubSection = () => (
  <section id="hubs" className="max-w-5xl mx-auto w-full px-6 py-20 scroll-mt-24">
     <div className="flex items-center gap-3 mb-12">
      <div className="h-px bg-gray-100 flex-1"></div>
      <div className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] px-4">Learning Hubs</div>
      <div className="h-px bg-gray-100 flex-1"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[
        { id: 'exchange-rate', name: '환율 (FX)', desc: '자본 흐름의 기점', icon: <Target /> },
        { id: 'interest-rate', name: '금리 (Rates)', desc: '돈의 시간 가치', icon: <Activity /> },
        { id: 'etf', name: 'ETF', desc: '분산 투자의 도구', icon: <BookOpen /> },
      ].map((hub) => (
        <Link 
          key={hub.id} 
          to={`/hub/${hub.id}`} 
          onClick={() => trackClick(`hub-${hub.id}`)}
          onMouseEnter={() => trackImpression(`hub-${hub.id}`)}
          className="group bg-white border border-gray-100 rounded-[32px] p-10 hover:border-primary transition-all hover:-translate-y-2 shadow-sm hover:shadow-xl"
        >
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-primary group-hover:text-white transition-all mb-8">
            {hub.icon}
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2 truncate">{hub.name}</h3>
          <p className="text-gray-500 font-medium text-sm mb-8 leading-relaxed">{hub.desc}</p>
          <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest">
            Explore Track <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      ))}
    </div>
  </section>
);

const FlowStepSection = ({ posts }: { posts: PostSummary[] }) => (
  <section id="flow-learning" className="max-w-5xl mx-auto w-full px-6 py-20 scroll-mt-24">
    <div className="flex items-center gap-3 mb-16">
      <div className="h-px bg-gray-100 flex-1"></div>
      <div className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] px-4">Logic Process</div>
      <div className="h-px bg-gray-100 flex-1"></div>
    </div>
    <div className="grid grid-cols-1 gap-6 relative">
      {[1, 2, 3, 4, 5].map((step) => {
        const representativePost = posts.find(p => p.flowStep === step);
        if (!representativePost) return null;

        return (
          <Link 
            key={step} 
            to={`/${representativePost.slug}`} 
            onClick={() => trackClick(representativePost.slug)}
            onMouseEnter={() => trackImpression(representativePost.slug)}
            className="flex flex-col md:flex-row items-center gap-8 p-8 bg-white border border-gray-100 rounded-[32px] hover:border-primary group transition-all"
          >
            <div className="w-20 h-20 rounded-[20px] bg-gray-50 flex flex-col items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
              <span className="text-[10px] uppercase font-black opacity-40">Step</span>
              <span className="text-3xl font-black leading-none">{step}</span>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                <span className="text-[11px] font-black text-primary uppercase tracking-tighter bg-primary/5 px-3 py-1 rounded-full">{representativePost.hub}</span>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Judgment Learning</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 group-hover:text-primary transition-colors mb-2 tracking-tight">{representativePost.title}</h3>
              <p className="text-gray-500 font-medium leading-relaxed max-w-2xl line-clamp-1">{representativePost.summary}</p>
            </div>
            <div className="flex-shrink-0">
               <div className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all">
                <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  </section>
);

// --- Pages ---

const HomePage = () => {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackView('home');
    Promise.all([
      fetch('/data/posts.json').then(res => res.json()),
      fetch('/data/signals.json').then(res => res.json())
    ]).then(([postsData, signalsData]) => {
      setPosts(postsData.filter((p: PostSummary) => isVisible(p)));
      setSignals(signalsData);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to fetch data:', err);
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  const firstPost = posts.find(p => p.flowStep === 1) || posts[0];

  return (
    <div className="flex flex-col">
      <Helmet>
        <title>Robo-Advisor | 판단의 로직을 소유하라</title>
        <meta name="description" content="금융 시장의 단순한 정보가 아닌, 스스로 판단할 수 있는 로직을 습득하세요." />
        <meta property="og:title" content="Robo-Advisor" />
        <meta property="og:description" content="단순 정보가 아닌 판단의 로직을 소유하라." />
        <meta property="og:type" content="website" />
      </Helmet>
      {/* HERO */}
      <section className="bg-white py-32 md:py-48 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <span className="inline-block bg-primary text-white text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.3em]">
              Decision Support Engine
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-8xl font-black leading-[0.9] tracking-tighter text-gray-900 mb-12"
          >
            단순 정보가 아닌<br />
            <span className="text-primary italic">판단의 로직</span>을 소유하라.
          </motion.h1>
          <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.3 }}
             className="flex justify-center"
          >
            <Link 
              to={firstPost ? `/${firstPost.slug}` : '#'}
              className="bg-primary text-white font-black py-6 px-16 rounded-full text-xl hover:bg-black transition-all flex items-center gap-4 group shadow-2xl hover:shadow-none"
            >
              로직 습득 시작하기 (STEP 01) <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      <GlobalSignalSection signals={signals} posts={posts} />
      <HubSection />
      <FlowStepSection posts={posts} />

      {/* ABOUT */}
      <section id="about" className="max-w-4xl mx-auto w-full px-6 py-40 scroll-mt-24 border-t border-gray-50">
        <div className="text-center">
          <div className="text-[11px] font-black text-primary uppercase tracking-[0.4em] mb-8">Concept Architecture</div>
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight mb-12 tracking-tighter">
            우리는 정보가 아닌<br />
            <span className="italic underline decoration-primary underline-offset-8">판단의 구조</span>를 설계합니다.
          </h2>
          <p className="text-xl text-gray-400 font-medium leading-relaxed max-w-2xl mx-auto">
            넘쳐나는 금융 뉴스 속에서 길을 잃지 마세요. Robo-Advisor는 시장의 신호를 어떻게 해석하고, 어떤 논리적 단계를 거쳐 결론에 도달해야 하는지 그 '과정'을 학습시킵니다.
          </p>
        </div>
      </section>
    </div>
  );
};

const HubPage = () => {
  const { hub } = useParams();
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hub) trackView(`hub-${hub}`);
    fetch('/data/posts.json')
      .then(res => res.json())
      .then(data => {
        setPosts(data.filter((p: PostSummary) => p.hub === hub && isVisible(p)));
        setLoading(false);
        window.scrollTo(0, 0);
      })
      .catch(err => {
        console.error('Failed to fetch hub data:', err);
        setLoading(false);
      });
  }, [hub]);

  if (loading) return null;

  const steps = [1, 2, 3, 4, 5];

  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <header className="mb-20 text-center">
        <div className="text-[11px] font-black text-primary uppercase tracking-[0.4em] mb-4">Dedicated Hub</div>
        <h1 className="text-5xl font-black text-gray-900 uppercase tracking-tighter">{hub?.replace('-', ' ')} TRACK</h1>
        <p className="text-gray-500 font-medium mt-4 text-lg">이 분야의 판단 실력을 키우기 위한 5단계 Flow입니다.</p>
      </header>

      <div className="flex flex-col gap-12">
        {steps.map(step => {
          const stepPosts = posts.filter(p => p.flowStep === step);
          if (stepPosts.length === 0) return null;

          return (
            <div key={step}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-black text-sm">
                  {step}
                </div>
                <h2 className="text-xl font-black text-gray-900 uppercase">Step {step}</h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {stepPosts.map(p => (
                  <Link 
                    key={p.slug} 
                    to={`/${p.slug}`} 
                    onClick={() => trackClick(p.slug)}
                    onMouseEnter={() => trackImpression(p.slug)}
                    className="flex items-center p-6 bg-white border border-gray-100 rounded-2xl hover:border-primary group transition-all"
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-black text-gray-900 group-hover:text-primary transition-colors">{p.title}</h3>
                      <p className="text-sm text-gray-500 font-medium line-clamp-1">{p.summary}</p>
                    </div>
                    <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FlowPage = () => {
  const { step } = useParams();
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (step) trackView(`flow-${step}`);
    fetch('/data/posts.json')
      .then(res => res.json())
      .then(data => {
        setPosts(data.filter((p: PostSummary) => p.flowStep === Number(step) && isVisible(p)));
        setLoading(false);
        window.scrollTo(0, 0);
      });
  }, [step]);

  if (loading) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
       <header className="mb-20 text-center">
        <div className="text-[11px] font-black text-primary uppercase tracking-[0.4em] mb-4">Step Focus</div>
        <h1 className="text-5xl font-black text-gray-900 uppercase tracking-tighter">STEP {step} PROCESS</h1>
        <p className="text-gray-500 font-medium mt-4 text-lg">모든 트랙의 0{step} 단계를 비교하며 학습하세요.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map(p => (
           <Link 
            key={p.slug} 
            to={`/${p.slug}`} 
            onClick={() => trackClick(p.slug)}
            onMouseEnter={() => trackImpression(p.slug)}
            className="flex flex-col p-8 bg-white border border-gray-100 rounded-[32px] hover:border-primary group transition-all"
          >
            <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded w-fit mb-4">{p.hub}</span>
            <h3 className="text-xl font-black text-gray-900 group-hover:text-primary transition-colors mb-4 leading-tight">{p.title}</h3>
            <p className="text-sm text-gray-500 font-medium line-clamp-2 leading-relaxed mb-8">{p.summary}</p>
            <div className="mt-auto flex items-center gap-2 text-xs font-black text-primary uppercase">
              Start Logic <ArrowRight size={14} />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-20 flex justify-center gap-4">
        {[1, 2, 3, 4, 5].map(s => (
          <Link 
            key={s} 
            to={`/flow/${s}`} 
            className={`w-12 h-12 flex items-center justify-center rounded-full font-black text-sm transition-all ${Number(step) === s ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
          >
            {s}
          </Link>
        ))}
      </div>
    </div>
  );
};

const DetailPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [allPosts, setAllPosts] = useState<PostSummary[]>([]);
  const [flow, setFlow] = useState<FlowIndex | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) trackView(slug);
    Promise.all([
      fetch(`/data/detail/${slug}.json`).then(res => res.json()),
      fetch('/data/posts.json').then(res => res.json()),
      fetch('/data/flow-index.json').then(res => res.json())
    ]).then(([postData, postsData, flowData]) => {
      setPost(postData);
      setAllPosts(postsData.filter((p: PostSummary) => isVisible(p)));
      setFlow(flowData);
      setLoading(false);
      window.scrollTo(0, 0);
    }).catch(err => {
      console.error('Failed to load detail:', err);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return null;
  
  if (!post || !isVisible(post)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-20 text-center">
        <h1 className="text-4xl font-black text-gray-900 mb-4 uppercase tracking-tighter">Access Restricted</h1>
        <p className="text-gray-500 font-medium mb-8">해당 콘텐츠는 아직 발행되지 않았거나 접근 권한이 없습니다.</p>
        <Link to="/" className="bg-primary text-white font-black py-4 px-8 rounded-full hover:bg-black transition-all">메인으로 돌아가기</Link>
      </div>
    );
  }

  // Unified Succession Algorithm
  const hubFlow = flow?.[post.hub];
  let nextSlug = null;

  if (hubFlow) {
    const currentStepSlugs = hubFlow[post.flowStep.toString()] || [];
    const currentIndex = currentStepSlugs.indexOf(post.slug);
    
    // 1. Same Hub Next Post in Same Step
    if (currentIndex < currentStepSlugs.length - 1) {
      nextSlug = currentStepSlugs[currentIndex + 1];
    } else {
      // 2. Next Step in Same Hub
      const nextStepKey = (post.flowStep + 1).toString();
      if (hubFlow[nextStepKey]?.length > 0) {
        nextSlug = hubFlow[nextStepKey][0];
      }
    }
  }

  // Related Posts: Same Hub or Same Step
  const related = allPosts
    .filter(p => p.slug !== post.slug && (p.hub === post.hub || p.flowStep === post.flowStep))
    .slice(0, 3);

  return (
    <div className="pb-40">
      <Helmet>
        <title>{post.seoTitle || post.title} | Robo-Advisor</title>
        <meta name="description" content={post.seoDescription || post.summary} />
        <meta property="og:title" content={post.seoTitle || post.title} />
        <meta property="og:description" content={post.seoDescription || post.summary} />
        {post.thumbnail && <meta property="og:image" content={post.thumbnail} />}
        <link rel="canonical" href={window.location.href} />
      </Helmet>
      <div className="max-w-3xl mx-auto px-6 py-20">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <header className="mb-16 text-center">
            <div className="flex items-center justify-center gap-4 mb-8">
              <Link to={`/hub/${post.hub}`} className="text-xs font-black text-primary bg-primary/5 px-4 py-1.5 rounded-full uppercase tracking-widest">{post.hub}</Link>
              <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Step {post.flowStep}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-[1.1] mb-8 tracking-tighter">{post.title}</h1>
            <div className="text-[11px] font-bold text-gray-300 uppercase tracking-[0.3em]">System Updated: {post.publishAt.split('T')[0]}</div>
          </header>

          <div className="prose prose-2xl prose-gray max-w-none font-medium leading-[1.8] mb-20 text-gray-700">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          <div className="h-px bg-gray-100 mb-20"></div>

          {/* Related Posts */}
          {related.length > 0 && (
            <div className="mb-20">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8 text-center">Contextual Learning</h4>
              <div className="grid grid-cols-1 gap-4">
                {related.map(r => (
                  <Link key={r.slug} to={`/${r.slug}`} className="flex items-center justify-between p-6 bg-gray-50 border border-transparent hover:border-primary rounded-2xl group transition-all">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-primary uppercase mb-1">{r.hub} · STEP {r.flowStep}</span>
                      <span className="text-lg font-black text-gray-900">{r.title}</span>
                    </div>
                    <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.article>
      </div>

      {/* Persistent Action Bar */}
      {nextSlug && (
        <div className="fixed bottom-0 left-0 w-full z-40 bg-white/90 backdrop-blur-2xl border-t border-gray-100 p-6 flex justify-center">
           <div className="max-w-3xl w-full">
            <Link 
              to={`/${nextSlug}`} 
              className="w-full bg-primary text-white h-20 rounded-3xl flex items-center justify-between px-10 hover:bg-black transition-all group shadow-2xl active:scale-[0.98]"
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.4em] mb-1">Forced Progression</span>
                <span className="text-xl md:text-2xl font-black tracking-tight leading-none">다음 판단 로직으로 이동</span>
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-primary transition-all">
                  <ArrowRight size={28} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
           </div>
        </div>
      )}
    </div>
  );
};

// --- Main Engine ---

export default function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/hub/:hub" element={<HubPage />} />
          <Route path="/flow/:step" element={<FlowPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedAdminRoute><AdminPage /></ProtectedAdminRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="posts" element={<AdminPosts />} />
            <Route path="signals" element={<AdminSignals />} />
            <Route path="new" element={<AdminNew />} />
            <Route path="edit/:slug" element={<AdminEdit />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route index element={<AdminDashboard />} />
          </Route>
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route path="/:slug" element={<DetailPage />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}
