import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Clock } from "lucide-react";
import { useGetNewsArticle, getGetNewsArticleQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Article() {
  const params = useParams();
  const id = Number(params.id);

  const { data: article, isLoading } = useGetNewsArticle(id, {
    query: {
      enabled: !!id,
      queryKey: getGetNewsArticleQueryKey(id)
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col max-w-2xl mx-auto w-full bg-background border-x border-border/50">
        <Skeleton className="w-full aspect-[4/5] md:aspect-video rounded-none mb-6" />
        <div className="p-5 md:p-8">
          <Skeleton className="h-6 w-20 mb-4" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-4/5 mb-10" />
          
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-[100dvh] flex flex-col max-w-2xl mx-auto w-full bg-background border-x border-border/50 p-6 items-center justify-center text-center">
        <h2 className="text-3xl font-bebas mb-4">Story not found</h2>
        <Link href="/" className="text-primary hover:underline font-bold uppercase tracking-wider text-sm">
          Return to headlines
        </Link>
      </div>
    );
  }

  const totalChars = article.bullets.join(" ").length;
  const readTimeMin = Math.max(1, Math.ceil(totalChars / 1000));

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-2xl mx-auto w-full bg-background border-x border-border/50 relative">
      
      <header className="fixed top-4 left-4 md:left-[calc(50%-max(336px,50vw)+1rem)] z-50">
        <Link href="/" className="inline-flex items-center justify-center h-10 px-4 gap-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-colors shadow-lg">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Back</span>
        </Link>
      </header>

      <main className="flex-1 pb-10">
        <div className="w-full aspect-[4/5] md:aspect-video relative overflow-hidden bg-muted">
          {article.imageUrl && (
            <img 
              src={article.imageUrl} 
              alt="" 
              className="object-cover w-full h-full"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-100" />
          
          <div className="absolute inset-x-0 bottom-0 p-5 md:p-8 flex flex-col gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <Badge className="bg-primary text-primary-foreground border-none font-black uppercase tracking-widest text-[10px] px-2.5 py-1">
                {article.category}
              </Badge>
              <span className="text-[11px] font-bold text-white/70 uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
              </span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl font-bebas leading-[1.05] tracking-wide text-white"
            >
              {article.headline}
            </motion.h1>
          </div>
        </div>

        <div className="p-5 md:p-8">
          <motion.ul 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col gap-5"
          >
            {article.bullets.map((bullet, i) => (
              <motion.li 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + (i * 0.1) }}
                className="flex items-start gap-4 p-5 rounded-xl border border-border/40 bg-card/30 relative overflow-hidden group hover:border-primary/30 transition-colors"
              >
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bebas text-xl mt-1">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <p className="text-[17px] md:text-lg font-medium leading-relaxed text-foreground/90">
                  {bullet}
                </p>
              </motion.li>
            ))}
          </motion.ul>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-10 flex justify-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <Clock className="w-3.5 h-3.5" />
              Read time: ~{readTimeMin} min
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
