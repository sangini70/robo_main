export interface PostSummary {
  slug: string;
  title: string;
  track: string;
  step: number;
  thumbnail?: string;
  publishDate: string;
  status: string;
  description?: string;
}

export interface PostDetail extends PostSummary {
  content: string;
  track_slug?: string;
  prev_slug?: string;
  next_slug?: string;
  related_slugs?: string[];
}

export interface FlowIndex {
  [track: string]: {
    [step: string]: string[];
  };
}
