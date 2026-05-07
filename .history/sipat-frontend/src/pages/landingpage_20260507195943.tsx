import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";
import { Link } from "react-router-dom";

const CanvasBg = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let W: number, H: number;
        let animationFrameId: number;
        const nodes: any[] = [];

        const resize = () => {
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        for (let i = 0; i < 55; i++) {
            nodes.push({
                x: Math.random() * 2000,
                y: Math.random() * 1400,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                r: Math.random() * 1.5 + 0.5
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            for (const n of nodes) {
                n.x += n.vx;
                n.y += n.vy;
                if (n.x < 0) n.x = W;
                if (n.x > W) n.x = 0;
                if (n.y < 0) n.y = H;
                if (n.y > H) n.y = 0;
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(59,130,246,0.35)";
                ctx.fill();
            }
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < 160) {
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.strokeStyle = `rgba(59,130,246,${0.06 * (1 - d / 160)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
            animationFrameId = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

const CountUp = ({ to, suffix = "", duration = 1.4 }: { to: number, suffix?: string, duration?: number }) => {
    const nodeRef = useRef<HTMLSpanElement>(null);
    const inView = useInView(nodeRef, { once: true, margin: "-50px" });

    useEffect(() => {
        if (inView && nodeRef.current) {
            const controls = animate(0, to, {
                duration: duration,
                ease: "easeOut",
                onUpdate(value) {
                    if (nodeRef.current) {
                        nodeRef.current.textContent = Math.round(value) + suffix;
                    }
                }
            });
            return () => controls.stop();
        }
    }, [to, suffix, duration, inView]);

    return <span ref={nodeRef}>0{suffix}</span>;
};

export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#050d1a] text-slate-900 dark:text-[#f0f6ff] font-sans overflow-x-hidden selection:bg-blue-500/30">
            <CanvasBg />

            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-[#050d1a]/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 h-16' : 'bg-transparent h-20'}`}>
                <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-full flex items-center justify-between">
                    <div className="flex items-center gap-3 font-black text-xl tracking-tight">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            S
                        </div>
                        Sipat
                    </div>

                    <div className="hidden md:flex items-center gap-10">
                        <a href="#explore" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Explore</a>
                        <a href="#features" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Features</a>
                        <a href="#transparency" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Transparency</a>
                        <a href="#community" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Community</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/login" className="hidden sm:block text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
                            Sign in
                        </Link>
                        <Link to="/register" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-blue-500/30 hover:-translate-y-0.5">
                            Sign up
                        </Link>
                    </div>
                </div>
            </nav>

            <section id="explore" className="relative z-10 min-h-screen flex items-center pt-32 pb-20 px-6 md:px-12 max-w-[1400px] mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center w-full">

                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs sm:text-sm font-bold mb-8">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></span>
                            Manila Civic Dashboard is now live
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-[5.5rem] font-black leading-[1.05] tracking-tighter mb-8 text-slate-900 dark:text-white">
                            See your<br />community<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-emerald-400">clearly.</span>
                        </h1>

                        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-lg mb-10">
                            The modern civic platform empowering citizens. Track local projects, verify public updates, and collaborate on community growth with radical transparency.
                        </p>

                        <div className="flex flex-wrap gap-4 mb-12">
                            <Link to="/explore" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white font-bold transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/30 group">
                                Explore your city
                                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </Link>
                            <Link to="/projects" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold transition-all hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-slate-600">
                                View open projects
                            </Link>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                {[11, 12, 14, 15, 16].map(num => (
                                    <img key={num} src={`https://i.pravatar.cc/72?img=${num}`} alt="Citizen" className="w-10 h-10 rounded-full border-2 border-slate-50 dark:border-[#050d1a] bg-slate-200 dark:bg-slate-800 object-cover" />
                                ))}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Joined by <strong className="text-slate-900 dark:text-white">10,000+</strong> active citizens</p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="hidden lg:block relative"
                    >
                        <motion.div
                            whileHover={{ rotateY: 0, rotateX: 0 }}
                            style={{ perspective: 1000 }}
                            className="relative bg-white/60 dark:bg-[#0a1628]/60 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-700/60 rounded-[2rem] p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none transform-gpu rotate-y-[-5deg] rotate-x-[2deg] transition-transform duration-700 hover:rotate-y-0 hover:rotate-x-0"
                        >
                            <motion.div
                                animate={{ y: [0, -8, 0] }}
                                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                                className="absolute -top-6 -right-6 bg-white/90 dark:bg-[#0a1628]/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-xl z-20"
                            >
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4 stroke-emerald-600 dark:stroke-emerald-400" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-900 dark:text-white">Project verified</div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Rizal Park renovation ✓</div>
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, -6, 0] }}
                                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1.5 }}
                                className="absolute -bottom-5 -left-6 bg-white/90 dark:bg-[#0a1628]/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-xl z-20"
                            >
                                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4 stroke-amber-600 dark:stroke-amber-400" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-900 dark:text-white">Budget approved</div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400">City Council · 2m ago</div>
                                </div>
                            </motion.div>

                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center">
                                        <svg className="w-5 h-5 stroke-blue-600 dark:stroke-blue-400" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-slate-900 dark:text-white">Metro Hub</div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Live infrastructure map</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Syncing
                                </div>
                            </div>

                            <div className="h-48 rounded-2xl bg-slate-100 dark:bg-[#0a1628] border border-slate-200 dark:border-slate-800 relative overflow-hidden mb-5">
                                <div className="absolute inset-0 opacity-20 dark:opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-blue-500/20 blur-xl"></motion.div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.6)] ring-4 ring-blue-500/30 z-10"></div>
                                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 200" preserveAspectRatio="none">
                                    <line x1="100" y1="60" x2="200" y2="100" stroke="rgba(59,130,246,0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
                                    <line x1="300" y1="50" x2="200" y2="100" stroke="rgba(168,85,247,0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
                                    <line x1="120" y1="150" x2="200" y2="100" stroke="rgba(20,184,166,0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
                                    <line x1="280" y1="140" x2="200" y2="100" stroke="rgba(245,158,11,0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
                                </svg>
                                <div className="absolute top-[30%] left-[25%] w-2.5 h-2.5 rounded-full bg-teal-500 ring-2 ring-teal-500/20"></div>
                                <div className="absolute top-[25%] left-[75%] w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-purple-500/20"></div>
                                <div className="absolute top-[75%] left-[30%] w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20"></div>
                                <div className="absolute top-[70%] left-[70%] w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20"></div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                                    <div className="text-xl font-black text-slate-900 dark:text-white mb-1">247</div>
                                    <div className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase">Active projects</div>
                                    <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">↑ 12 this week</div>
                                </div>
                                <div className="bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                                    <div className="text-xl font-black text-slate-900 dark:text-white mb-1">₱2.4B</div>
                                    <div className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase">Tracked budget</div>
                                    <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">↑ 8.2%</div>
                                </div>
                                <div className="bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                                    <div className="text-xl font-black text-slate-900 dark:text-white mb-1">98%</div>
                                    <div className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase">Verified reports</div>
                                    <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">↑ 3pts</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-slate-800">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                                    <div className="flex-1 text-xs text-slate-600 dark:text-slate-300 truncate"><strong className="text-slate-900 dark:text-white">Road repair</strong> started on EDSA</div>
                                    <div className="text-[9px] text-slate-400 font-bold">5m ago</div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-slate-800">
                                    <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0"></div>
                                    <div className="flex-1 text-xs text-slate-600 dark:text-slate-300 truncate"><strong className="text-slate-900 dark:text-white">Budget report</strong> published Q2</div>
                                    <div className="text-[9px] text-slate-400 font-bold">1h ago</div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            <section className="relative z-10 border-y border-slate-200/60 dark:border-slate-800/60 py-12 md:py-16 bg-white/40 dark:bg-[#050d1a]/40 backdrop-blur-sm">
                <div className="max-w-[1400px] mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 divide-x-0 md:divide-x divide-slate-200 dark:divide-slate-800">
                    <div className="text-center px-4">
                        <div className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2"><CountUp to={24} /></div>
                        <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Cities connected</div>
                        <div className="text-[10px] md:text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-2">↑ 4 new this month</div>
                    </div>
                    <div className="text-center px-4">
                        <div className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2"><CountUp to={10} suffix="K+" /></div>
                        <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Active citizens</div>
                        <div className="text-[10px] md:text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-2">↑ 18% growth</div>
                    </div>
                    <div className="text-center px-4">
                        <div className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2"><CountUp to={247} /></div>
                        <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Projects tracked</div>
                        <div className="text-[10px] md:text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-2">↑ 47 this week</div>
                    </div>
                    <div className="text-center px-4">
                        <div className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2"><CountUp to={98} suffix="%" /></div>
                        <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Report accuracy</div>
                        <div className="text-[10px] md:text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-2">Citizen-audited</div>
                    </div>
                </div>
            </section>

            <section id="features" className="relative z-10 py-24 md:py-32 px-6 md:px-12 max-w-[1400px] mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 tracking-widest uppercase mb-4">
                            <span className="w-6 h-px bg-blue-600 dark:bg-blue-400"></span> Platform features
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-6">
                            Everything you need<br />to stay informed.
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                            Sipat brings municipal data directly to your fingertips through beautifully designed, intuitive civic tools.
                        </p>
                    </div>
                    <Link to="/features" className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group">
                        View all features
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <motion.div whileHover={{ y: -8 }} className="bg-white/60 dark:bg-[#0a1628]/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-8 hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:border-blue-500/30 transition-all group">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 stroke-blue-600 dark:stroke-blue-400" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">Explore community</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-6">Discover local initiatives and infrastructure plans mapped precisely in your district with real-time overlays.</p>
                        <Link to="/explore" className="flex items-center gap-1.5 text-sm font-bold text-slate-400 group-hover:text-blue-500 transition-colors">
                            Learn more <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </Link>
                    </motion.div>

                    <motion.div whileHover={{ y: -8 }} className="bg-white/60 dark:bg-[#0a1628]/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-8 hover:shadow-2xl hover:shadow-emerald-500/10 dark:hover:border-emerald-500/30 transition-all group">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 stroke-emerald-600 dark:stroke-emerald-400" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">Verified reports</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-6">Access cryptographically secure, citizen-audited reports on public spending — no more unverifiable claims.</p>
                        <Link to="/reports" className="flex items-center gap-1.5 text-sm font-bold text-slate-400 group-hover:text-emerald-500 transition-colors">
                            Learn more <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </Link>
                    </motion.div>

                    <motion.div whileHover={{ y: -8 }} className="bg-white/60 dark:bg-[#0a1628]/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-8 hover:shadow-2xl hover:shadow-teal-500/10 dark:hover:border-teal-500/30 transition-all group">
                        <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 stroke-teal-600 dark:stroke-teal-400" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">Live tracking</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-6">Monitor construction milestones, timelines, and budget allocations in real-time with instant citizen alerts.</p>
                        <Link to="/tracking" className="flex items-center gap-1.5 text-sm font-bold text-slate-400 group-hover:text-teal-500 transition-colors">
                            Learn more <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </Link>
                    </motion.div>

                    <motion.div whileHover={{ y: -8 }} className="bg-white/60 dark:bg-[#0a1628]/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-8 hover:shadow-2xl hover:shadow-purple-500/10 dark:hover:border-purple-500/30 transition-all group">
                        <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 stroke-purple-600 dark:stroke-purple-400" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">Citizen dashboard</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-6">Personalized feed of townhalls, polls, and updates relevant to your neighborhood — your voice amplified.</p>
                        <Link to="/dashboard" className="flex items-center gap-1.5 text-sm font-bold text-slate-400 group-hover:text-purple-500 transition-colors">
                            Learn more <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </Link>
                    </motion.div>
                </div>
            </section>

            <section id="community" className="relative z-10 py-24 md:py-32 px-6 md:px-12 max-w-[1400px] mx-auto text-center">
                <div className="bg-white/60 dark:bg-[#0a1628]/80 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-800/60 rounded-[3rem] p-12 md:p-24 relative overflow-hidden shadow-xl dark:shadow-none">
                    <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/20 dark:bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>

                    <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.05] mb-6 relative z-10">
                        Your city.<br />Your data.
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium max-w-2xl mx-auto mb-10 relative z-10">
                        Join thousands of Filipinos building a more accountable, transparent future — one barangay at a time.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4 relative z-10">
                        <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white font-bold transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/30 group">
                            Get started free
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </Link>
                        <button className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold transition-all hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-slate-600">
                            Schedule a demo
                        </button>
                    </div>
                </div>
            </section>

            <footer className="relative z-10 py-10 px-6 md:px-12 border-t border-slate-200/60 dark:border-slate-800/60 max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-2 font-black text-lg tracking-tight text-slate-900 dark:text-white">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white text-xs">
                        S
                    </div>
                    Sipat
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    © 2026 Sipat Civic Technologies. Built for the people.
                </p>
                <div className="flex items-center gap-6">
                    <a href="#" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Privacy</a>
                    <a href="#" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Terms</a>
                    <a href="#" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Contact</a>
                    <a href="#" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">GitHub</a>
                </div>
            </footer>
        </div>
    );
}