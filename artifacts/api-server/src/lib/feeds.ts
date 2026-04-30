export interface FeedSource {
  url: string;
  category: string;
}

// Indian news sources only. Excluded: Times of India, The Hindu.
// Sources: NDTV, News18, India TV, Zee News.
export const FEEDS: FeedSource[] = [
  // NDTV
  { url: "https://feeds.feedburner.com/ndtvnews-top-stories", category: "Top" },
  { url: "https://feeds.feedburner.com/ndtvnews-india-news", category: "India" },
  { url: "https://feeds.feedburner.com/ndtvnews-world-news", category: "World" },
  { url: "https://feeds.feedburner.com/ndtvnews-business", category: "Business" },
  { url: "https://feeds.feedburner.com/ndtvsports-latest", category: "Sports" },
  { url: "https://feeds.feedburner.com/ndtvmovies-latest", category: "Entertainment" },
  { url: "https://feeds.feedburner.com/gadgets360-latest", category: "Technology" },

  // News18
  { url: "https://www.news18.com/rss/india.xml", category: "India" },
  { url: "https://www.news18.com/rss/world.xml", category: "World" },
  { url: "https://www.news18.com/rss/business.xml", category: "Business" },
  { url: "https://www.news18.com/rss/sports.xml", category: "Sports" },
  { url: "https://www.news18.com/rss/movies.xml", category: "Entertainment" },
  { url: "https://www.news18.com/rss/tech.xml", category: "Technology" },

  // India TV
  { url: "https://www.indiatvnews.com/rssnews/topstory.xml", category: "Top" },
  { url: "https://www.indiatvnews.com/rssnews/topstory-india.xml", category: "India" },
  { url: "https://www.indiatvnews.com/rssnews/topstory-world.xml", category: "World" },
  { url: "https://www.indiatvnews.com/rssnews/topstory-business.xml", category: "Business" },
  { url: "https://www.indiatvnews.com/rssnews/topstory-sports.xml", category: "Sports" },
  { url: "https://www.indiatvnews.com/rssnews/topstory-entertainment.xml", category: "Entertainment" },

  // Zee News
  { url: "https://zeenews.india.com/rss/india-national-news.xml", category: "India" },
  { url: "https://zeenews.india.com/rss/world-news.xml", category: "World" },
  { url: "https://zeenews.india.com/rss/business.xml", category: "Business" },
  { url: "https://zeenews.india.com/rss/sports-news.xml", category: "Sports" },
  { url: "https://zeenews.india.com/rss/entertainment-news.xml", category: "Entertainment" },
  { url: "https://zeenews.india.com/rss/technology-news.xml", category: "Technology" },
];

export const CATEGORIES = ["Top", "India", "World", "Business", "Sports", "Entertainment", "Technology"];
