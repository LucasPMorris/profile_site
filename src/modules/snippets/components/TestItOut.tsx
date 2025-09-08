"use client";

import React, { useState } from 'react';
import { motion as Motion, AnimatePresence, motion } from 'framer-motion';
import { SiJavascript } from 'react-icons/si';
import { HiOutlinePlay as PlayIcon } from 'react-icons/hi';
import { HiChevronDown as ChevronDownIcon } from 'react-icons/hi';

import Playground from '@/modules/playground';

interface TestItOutProps { title: string; code: string; description: string; snippetId: string; }

const TestItOut: React.FC<TestItOutProps> = ({  title, code, description, snippetId  }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const toggleExpanded = (): void => {
    setIsExpanded(!isExpanded);
    
    // Smooth scroll to the expanded section
    if (!isExpanded) {
      setTimeout(() => {
        const element = document.getElementById(`${snippetId}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          const offset = window.pageYOffset + rect.top - 100;
          window.scrollTo({ top: offset, behavior: 'smooth' });
        }
      }, 200);
    }
  };

  return (
    <Motion.div id={`${snippetId}`} className="mb-6" layout initial={false} >
      {/* Snippet Content */}
      <div className="mb-4">
        {/* Test it Out Button */}
        <motion.button type="button" onClick={toggleExpanded} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} >
          <PlayIcon size={16} />
          <span>{isExpanded ? 'Hide Playground' : 'Test it Out'}</span>
          <Motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}><ChevronDownIcon size={16} /></Motion.div>
        </motion.button>
      </div>

      {/* Expandable Playground Section */}
      <AnimatePresence>
        {isExpanded && (
          <Motion.div
            initial={{ height: 0, opacity: 0, y: -20 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -20 }}
            transition={{ 
              height: { duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] },
              opacity: { duration: 0.4, delay: isExpanded ? 0.1 : 0 },
              y: { duration: 0.4, delay: isExpanded ? 0.1 : 0 }
            }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-inner">
              {/* Playground Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <SiJavascript size={20} className="text-yellow-400" />
                <h4 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Interactive JavaScript Playground</h4>
              </div>
                           
              {/* Help Text */}
              <div className="mt-6 mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
                <div className="flex items-start gap-2">
                  <span className="text-lg">💡</span>
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">Try it yourself!</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Modify the code above, add console.log statements, or change variables to see how it affects the output in real-time.</p>
                  </div>
                </div>
              </div>

              {/* Your Existing Playground Component */}
              <Playground initialCode={code} />

            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Separator */}
      <div className="mt-8 border-b border-neutral-200 dark:border-neutral-700"></div>
    </Motion.div>
  );
};

export default TestItOut;