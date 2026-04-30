import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Clock, ArrowRight, Zap, TrendingUp } from "lucide-react";
import { useListNews, useListCategories, getListNewsQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import logoUrl from "@assets/WhatsApp_Image_2026-04-23_at_3.03.48_AM_1776893672219.jpeg";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string | undefined>();
  const [tickerIndex, setTickerIndex] = useState(0);
  
  const { data: categories, isLoading: isCategoriesLoading } = useListCategories();
  
  const queryParams = activeCategory ? { category: activeCategory } : {};
  const { data: news, isLoading: isNewsLoading } = useListNews(queryParams, {
    query: {
      refetchInterval: 60000,
      queryKey: getListNewsQueryKey(queryParams)
    }
  });

  const tickerNews = news ? news.slice(0, 3) : [];

  useEffect(() => {
    if (!tickerNews.length) return;
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerNews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [tickerNews.length]);

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-2xl mx-auto w-full bg-background border-x border-border/50 relative">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50 relative overflow-hidden">
        {/* Subtle radial glow behind header */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="px-4 py-4 flex flex-col gap-1.5 relative">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bebas tracking-wide text-primary drop-shadow-[0_0_18px_rgba(153,0,0,0.55)] mt-1">
              BUL IT
            </h1>
            <motion.img
              src={logoUrl}
              alt=""
              initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 14 }}
              className="h-10 w-10 rounded-sm object-cover ring-1 ring-primary/40 shadow-[0_0_18px_rgba(153,0,0,0.45)]"
            />
            <motion.span
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(153,0,0,0.9)]" />
              Live
            </motion.span>
          </div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            India's New Era of News App
          </p>
        </div>
        
        <div className="border-t border-border/50 relative">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-3 p-3 items-center">
              <button
                onClick={() => setActiveCategory(undefined)}
                className={`text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full transition-all ${
                  !activeCategory 
                    ? "bg-primary/10 border-primary text-primary shadow-[0_0_10px_rgba(153,0,0,0.3)] border" 
                    : "border border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                Top Stories
              </button>
              
              {isCategoriesLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-24 rounded-full" />
                ))
              ) : (
                categories?.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full transition-all ${
                      activeCategory === category 
                        ? "bg-primary/10 border-primary text-primary shadow-[0_0_10px_rgba(153,0,0,0.3)] border" 
                        : "border border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {category}
                  </button>
                ))
              )}
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </div>

        {/* Ticker */}
        {tickerNews.length > 0 && (
          <div className="border-t border-border/30 bg-background/50 flex items-center px-4 py-2 text-xs overflow-hidden relative">
            <div className="flex items-center gap-2 mr-3 z-10 bg-background/95 pr-2">
              <span className="bg-primary text-primary-foreground font-black uppercase text-[9px] px-1.5 py-0.5 rounded-sm tracking-widest flex items-center gap-1">
                <Zap className="h-3 w-3" /> Breaking
              </span>
            </div>
            <div className="relative flex-1 h-[18px]">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={tickerIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center whitespace-nowrap text-muted-foreground font-medium truncate pr-4"
                >
                  <Link href={`/article/${tickerNews[tickerIndex].id}`} className="hover:text-primary transition-colors truncate">
                    {tickerNews[tickerIndex].headline}
                  </Link>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 p-4 flex flex-col gap-5">
        {isNewsLoading ? (
          <>
            <div className="w-full aspect-[4/5] rounded-xl overflow-hidden relative">
               <Skeleton className="absolute inset-0" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 border border-border/50 rounded-lg">
                 <Skeleton className="h-[100px] w-[100px] rounded-md shrink-0" />
                 <div className="flex flex-col gap-2 flex-1 py-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-4/5" />
                 </div>
              </div>
            ))}
          </>
        ) : news?.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full border-2 border-primary"
              />
              <motion.img
                src={logoUrl}
                alt=""
                className="w-12 h-12 rounded-sm ring-1 ring-primary/50 relative z-10"
              />
            </div>
            <h3 className="text-3xl font-bebas tracking-wide mb-2 text-foreground">Pulling fresh stories</h3>
            <p className="text-sm font-medium text-muted-foreground">The newsroom is preparing your bullets.</p>
          </div>
        ) : (
          news?.map((article, i) => {
            const isHero = i === 0;

            if (isHero) {
              return (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Link href={`/article/${article.id}`} className="block group">
                    <article className="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-border group-hover:border-primary/50 transition-colors shadow-xl bg-secondary/40">
                      {article.imageUrl ? (
                        <img
                          src={article.imageUrl}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-secondary flex items-center justify-center">
                          <TrendingUp className="w-24 h-24 text-primary/10" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90" />
                      <div className="absolute inset-0 p-5 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <Badge className="bg-primary text-primary-foreground border-none font-black uppercase tracking-widest text-[10px] px-2.5 py-1">
                            {article.category}
                          </Badge>
                        </div>
                        <div className="mt-auto">
                          <h2 className="text-3xl md:text-4xl font-bebas leading-[1.05] tracking-wide text-white mb-4 group-hover:text-primary/90 transition-colors">
                            {article.headline}
                          </h2>
                          <div className="flex items-center gap-2 text-white/70 text-xs font-semibold uppercase tracking-wider">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Link href={`/article/${article.id}`} className="block group">
                  <article className="relative flex gap-4 p-4 border border-border/40 bg-card/40 rounded-xl overflow-hidden hover:bg-card/80 transition-colors">
                    {/* Hover accent line */}
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary scale-y-0 origin-top group-hover:scale-y-100 transition-transform duration-300 ease-out" />
                    
                    {article.imageUrl ? (
                      <div className="w-[100px] md:w-[130px] shrink-0 aspect-square rounded-lg overflow-hidden relative">
                        <img
                          src={article.imageUrl}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-[100px] md:w-[130px] shrink-0 aspect-square rounded-lg bg-secondary/50 flex items-center justify-center relative overflow-hidden">
                        <span className="text-5xl font-bebas text-primary/20 absolute -right-2 -bottom-4">
                          {article.headline.charAt(0)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex flex-col py-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                          {article.category}
                        </span>
                      </div>
                      <h2 className="text-base md:text-lg font-bold leading-snug group-hover:text-primary transition-colors line-clamp-3 mb-auto">
                        {article.headline}
                      </h2>
                      <div className="flex items-center justify-between mt-3 text-muted-foreground">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                        </div>
                        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                      </div>
                    </div>
                  </article>
                </Link>
              </motion.div>
            );
          })
        )}
      </main>
    </div>
  );
}
