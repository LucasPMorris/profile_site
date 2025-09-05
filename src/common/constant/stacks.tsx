import { BsFillBootstrapFill, BsTerminalFill, BsRegex, BsRobot } from 'react-icons/bs';
import { BiLogoPostgresql } from 'react-icons/bi';
import { SiAngular, SiApollographql, SiCss3, SiExpress, SiFirebase, SiGatsby, SiGraphql, SiJavascript, SiJest, SiGooglechrome, SiInsomnia,
  SiJquery, SiLaravel, SiMui, SiNextdotjs, SiNginx, SiNodedotjs, SiNuxtdotjs, SiPhp, SiPrisma, SiPwa, SiReact, SiNotepadplusplus,
  SiRedux, SiSocketdotio, SiStorybook, SiStyledcomponents, SiTailwindcss, SiTypescript, SiVite, SiVuedotjs, SiVlcmediaplayer, SiGimp,
  SiWebpack, SiWordpress, 
  SiVisualstudiocode} from 'react-icons/si';
import type { JSX } from "react";

export type stacksProps = { [key: string]: JSX.Element;};

const iconSize = 20;

// TODO-Pending: Complete this list! This also adds icons to the snippets sub-content items.
// Also - consider breaking out software icons into a separate list?
export const STACKS: stacksProps = {
  PHP: <SiPhp size={iconSize} className='text-blue-500' />,
  JavaScript: <SiJavascript size={iconSize} className='text-yellow-400' />,
  TypeScript: <SiTypescript size={iconSize} className='text-blue-400' />,
  'Next.js': <SiNextdotjs size={iconSize} />,
  'React.js': <SiReact size={iconSize} className='text-sky-500' />,
  TailwindCSS: <SiTailwindcss size={iconSize} className='text-cyan-300' />,
  PostgreSQL: <BiLogoPostgresql size={iconSize} style={{ color: 'rgb(0, 100, 165)' }} />,
  Regex: <BsRegex size={iconSize} className='text-white' />,
  GraphQL: <SiGraphql size={iconSize} className='text-pink-600' />,
  WordPress: <SiWordpress size={iconSize} />,
  Prisma: <SiPrisma size={iconSize} className='text-emerald-500' />,
  'Artificial Intelligence': ( <BsRobot size={iconSize} className='text-rose-500' /> ),
  'Nuxt.js': <SiNuxtdotjs size={iconSize} className='text-green-400' />,
  'Node.js': <SiNodedotjs size={iconSize} className='text-green-600' />,
  Redux: <SiRedux size={iconSize} className='text-purple-500' />,
  Webpack: <SiWebpack size={iconSize} className='text-blue-500' />,
  'Styled Components': ( <SiStyledcomponents size={iconSize} className='text-pink-500' />),
  Nginx: <SiNginx size={iconSize} className='text-green-500' />,
  Jest: <SiJest size={iconSize} className='text-red-600' />,
  CSS: <SiCss3 size={iconSize} className='text-blue-300' />,
  Socket: <SiSocketdotio size={iconSize} />,
  Express: <SiExpress size={iconSize} />,
  Jquery: <SiJquery size={iconSize} />,

  // These are applications/software I use
  VLC: <SiVlcmediaplayer size={iconSize} style={{ color: 'rgb(232, 94, 0)' }} />,
  NotepadPlusplus: <SiNotepadplusplus size={iconSize} style={{ color: 'rgb(0, 128, 0)' }} />,
  Gimp: <SiGimp size={iconSize} style={{ color: 'rgb(161, 136, 127)' }} />,
  Chrome: <SiGooglechrome size={iconSize} className='text-neutral-600' />,
  Insomnia: <SiInsomnia size={iconSize} style={{ color: 'rgb(58, 50, 130)' }} />, // Brighter color
  VSCode: <SiVisualstudiocode size={iconSize} style={{ color: 'rgb(0, 122, 204)' }} />,
  Bash: <BsTerminalFill size={iconSize} className='text-dark' />,

  /*
  Git:
  Excel:
  PowerPoint:
  Word:
  Outlook:
  Slack:
  Figma:
  Jira:
  Confluence:
  Trello:
  HubSpot:
  Salesforce:
  vTiger:
  Zoho:
  ZenDesk:
  Docker:
  Kubernetes:
  Terraform:
  
  */

//  Apollo: <SiApollographql size={iconSize} />,
//  Bootstrap: ( <BsFillBootstrapFill size={iconSize} className='text-purple-500' /> ),
//  Laravel: <SiLaravel size={iconSize} className='text-red-500' />,
//  'Material UI': <SiMui size={iconSize} className='text-sky-400' />,
//  Vite: <SiVite size={iconSize} className='text-purple-500' />,
//  Firebase: <SiFirebase size={iconSize} className='text-yellow-500' />,
//  Angular: <SiAngular size={iconSize} className='text-red-500' />,
//  'Vue.js': <SiVuedotjs size={iconSize} className='text-green-500' />,
//  Gatsby: <SiGatsby size={iconSize} className='text-purple-600' />,
//  PWA: <SiPwa size={iconSize} className='text-amber-600' />,
//  Storybook: <SiStorybook size={iconSize} className='text-amber-500' />,

};
