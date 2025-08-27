import * as React from 'react';
import { HTMLMotionProps } from 'framer-motion';

// This extends all HTML motion components to accept all standard HTML props.
declare module 'framer-motion' {
  export interface HTMLMotionProps<T extends HTMLElement>
    extends React.HTMLAttributes<T> {}
}