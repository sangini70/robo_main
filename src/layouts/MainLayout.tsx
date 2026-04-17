import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const menuItems = [
    { name: 'Home', path: '/' },
    { name: '지금 시장', path: '/#global-signal', isAnchor: true },
    { name: '흐름 학습', path: '/flow/1' },
    { name: 'About', path: '/#about', isAnchor: true },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="text-xl font-black tracking-tighter text-primary uppercase">
            ROBO-ADVISOR
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {menuItems.map((item) => (
            item.isAnchor ? (
               <a 
                key={item.name}
                href={item.path} 
                className="text-sm font-bold text-gray-500 hover:text-primary transition-colors"
              >
                {item.name}
              </a>
            ) : (
              <Link 
                key={item.name}
                to={item.path} 
                className={`text-sm font-bold transition-colors ${location.pathname === item.path ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}
              >
                {item.name}
              </Link>
            )
          ))}
        </div>

        {/* Mobile Menu Toggle */}
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-gray-500 p-2">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-white border-b border-gray-100 absolute w-full left-0 shadow-lg"
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              {menuItems.map((item) => (
                item.isAnchor ? (
                  <a 
                    key={item.name}
                    href={item.path} 
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-black text-gray-900"
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link 
                    key={item.name}
                    to={item.path} 
                    onClick={() => setIsOpen(false)}
                    className={`text-lg font-black ${location.pathname === item.path ? 'text-primary' : 'text-gray-900'}`}
                  >
                    {item.name}
                  </Link>
                )
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-gray-50 border-t border-gray-100 py-12 px-6">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
      <div className="text-sm font-black text-gray-400 uppercase tracking-widest">ROBO-ADVISOR</div>
      <div className="flex gap-8 text-[11px] font-bold text-gray-500 uppercase">
        <Link to="/privacy" className="hover:text-primary">Privacy</Link>
        <Link to="/terms" className="hover:text-primary">Terms</Link>
        <Link to="/contact" className="hover:text-primary">Contact</Link>
      </div>
      <div className="text-[11px] text-gray-400 font-medium">© 2026 ROBO-ADVISOR SYSTEM. All rights reserved.</div>
    </div>
  </footer>
);

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-gray-900">
      <Navbar />
      <main className="flex-grow pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
};
