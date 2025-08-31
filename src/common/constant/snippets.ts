import { ContentProps } from '../types/snippets';

// TODO-Pending: Replace iamges
export const SNIPPETS_CONTENTS: ContentProps[] = [
  {
    id: 1,
    title: 'Code and Terminal Snippets',
    slug: 'code',
    description: 'Frequently used lines of code or terminal commands with descriptions.',
    image: 'https://cloud.aulianza.com/public/images/learn/javascript.webp',
    is_new: true,
    level: 'Beginner',
    is_show: true,
  },
  {
    id: 2,
    title: 'Software',
    slug: 'software',
    description: 'Software that I use and tips and tricks to make great use of them.',
    image: 'https://cloud.aulianza.com/public/images/learn/learn-problem-solving.png',
    is_new: false,
    level: 'All Levels',
    is_show: true,
  },
];
