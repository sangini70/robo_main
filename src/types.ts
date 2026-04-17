export type PostStatus = 'draft' | 'scheduled' | 'published';
export type IndexStatus = '미요청' | '요청완료' | '색인확인';

export interface PostSummary {
  slug: string;
  title: string;
  hub: string;
  flowStep: number;
  status: PostStatus;
  publishAt: string;
  summary: string;
  thumbnail?: string;
  googleIndexStatus?: IndexStatus;
  naverIndexStatus?: IndexStatus;
  category?: string;
  language?: 'ko' | 'en';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PostDetail extends PostSummary {
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  prev_slug?: string;
  next_slug?: string;
  related_slugs?: string[];
}

export interface FlowIndex {
  [hub: string]: {
    [step: string]: string[];
  };
}

export interface MarketSignal {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  linked_hub: string;
  linked_flow_step: number;
  linked_slug?: string;
  status: 'active' | 'inactive';
  order: number;
}
