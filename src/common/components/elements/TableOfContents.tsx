import { useMemo, useState } from 'react';
import { MobileTOC } from './MobileTOC';
import { FloatingTOC } from './FloatingTOC';
import { InlineTOC } from './InlineTOC';

interface TocItem { id: string; title: string; line: number; originalTitle: string; level: number; }
interface TableOfContentsProps { content: string; title?: string; showMobile?: boolean; mode?: 'inline' | 'floating' | 'mobile'; }

export const TableOfContents = ({ content, title = "Contents", showMobile = true, mode = 'inline' }: TableOfContentsProps) => {
  const tableOfContents = useMemo(() => {
    if (!content) return [];
    
    const lines = content.split('\n');
    const tocItems: TocItem[] = [];

    lines.forEach((line, index) => {
      const spanMatch = line.match(/<span\s+id="([^"]+)"\s+name="([^"]+)"\s+data-toc(sub)?[^>]*>/);
      if (spanMatch) {
        const id = spanMatch[1].trim();
        const displayTitle = spanMatch[2].trim();
        const isSubsection = !!spanMatch[3];
        tocItems.push({ id, title: displayTitle, line: index + 1, originalTitle: displayTitle, level: isSubsection ? 2 : 1 });
      }
    });

    return tocItems;
  }, [content]);

  const scrollToSection = (item: TocItem) => {
    const element = document.getElementById(item.id);
    
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    } else { 
      const spanByName = document.querySelector(`span[name="${item.title}"]`);
      if (spanByName) {
        const headerOffset = 80;
        const elementPosition = spanByName.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      } else { console.warn(`Could not find span with name: ${item.title}`); } }
  };

  if (tableOfContents.length === 0) { return null; }

  if (mode === 'inline') { return <InlineTOC content={content} tableOfContents={tableOfContents} title={title} />; }
  if (mode === 'floating') { return <FloatingTOC content={content} tableOfContents={tableOfContents} title={title} />; }

  return null;
};