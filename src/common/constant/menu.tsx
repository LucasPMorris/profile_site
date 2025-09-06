import { BiRocket as ContactIcon } from 'react-icons/bi';
import { BsEnvelopeAtFill as EmailIcon, BsGithub as GithubIcon, BsInstagram as InstagramIcon,
         BsLinkedin as LinkedinIcon, BsYoutube as YoutubeIcon, BsTwitter as TwitterIcon } from 'react-icons/bs';
import { FiBookOpen as SnippetsIcon, FiCoffee as ProjectIcon, FiCpu as DashboardIcon, FiPieChart as AnalyticsIcon,
         FiPocket as HomeIcon, FiRss as BlogIcon, FiUser as ProfileIcon } from 'react-icons/fi';
import { PiChatCircleDotsBold as ChatIcon } from 'react-icons/pi';
import { SiJavascript } from 'react-icons/si';

import { MenuItemProps } from '../types/menu';

const iconSize = 20;

export const MENU_ITEMS: MenuItemProps[] = [
  { title: 'Home', href: '/', icon: <HomeIcon size={iconSize} />, isShow: true, isExternal: false, eventName: 'Pages: Home', type: 'Pages' },
  { title: 'My Story', href: '/about', icon: <ProfileIcon size={iconSize} />, isShow: true, isExternal: false, eventName: 'Pages: About', type: 'Pages' },  
  { title: 'Dashboard', href: '/dashboard', icon: <DashboardIcon size={iconSize} />, isShow: true, isExternal: false, eventName: 'Pages: Dashboard', type: 'Pages' },
  { title: 'Projects', href: '/projects', icon: <ProjectIcon size={iconSize} />, isShow: true, isExternal: false, eventName: 'Pages: Projects', type: 'Pages' },
  { title: 'Blog', href: '/blog', icon: <BlogIcon size={iconSize} />, isShow: true, isExternal: false, eventName: 'Pages: Blog', type: 'Pages' },
  // { title: 'Snippets', href: '/snippets', icon: <SnippetsIcon size={iconSize} />, isShow: true, isExternal: false, eventName: 'Pages: Snippets', type: 'Pages' },
  { title: 'Contact', href: '/contact', icon: <ContactIcon size={iconSize} />, isShow: true, isExternal: false, eventName: 'Pages: Contact', type: 'Pages' },
];

export const SOCIAL_MEDIA: MenuItemProps[] = [
  {
    title: 'Email', href: 'mailto:lucas.morris@untethered4life.com',
    icon: <EmailIcon size={iconSize} />, isShow: true, isExternal: true,
    eventName: 'Contact: Email', type: 'Link',
    className: '!bg-green-600 border border dark:border-neutral-700'
  },
  {
    title: 'Linkedin', href: 'http://www.linkedin.com/in/lucas-morris-bb79756/',
    icon: <LinkedinIcon size={iconSize} />, isShow: true, isExternal: true,
    eventName: 'Social: Linkedin',     type: 'Link',
    className: '!bg-blue-500 border border dark:border-neutral-700',
  },
  {
    title: 'Github', href: 'https://github.com/LucasPMorris',
    icon: <GithubIcon size={iconSize} />, isShow: true, isExternal: true,
    eventName: 'Social: Github', type: 'Link',
    className: '!bg-black border border dark:border-neutral-700'
  },
  {
    title: 'YouTube', href: 'https://www.youtube.com/@untethered4life',
    icon: <YoutubeIcon size={iconSize} />, isShow: true, isExternal: true, 
    eventName: 'Social: YouTube', type: 'Link',
    className: '!bg-red-500 border border dark:border-neutral-700'
  },  
];

// REMOVED: Not using Umami
// export const EXTERNAL_LINKS: MenuItemProps[] = [
//   {
//     title: 'Analytics',
//     href: 'https://analytics.lucasmorris.com/share/LK5kiRuosw9pORLa/lucas.untethered4life.com',
//     icon: <AnalyticsIcon size={iconSize} />,
//     isShow: true,
//     isExternal: true,
//     eventName: 'External Link: Analytics',
//     type: 'Link',
//   },
// ];
