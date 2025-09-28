export interface TocItem { id: string; title: string; line: number; originalTitle: string; level: number; }
export interface InlineTOCProps { content: string; tableOfContents: TocItem[]; title?: string; }
export interface TableOfContentsProps { content: string; title?: string; showMobile?: boolean; mode?: string; }