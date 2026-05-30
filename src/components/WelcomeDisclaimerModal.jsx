import { useEffect, useRef } from 'react';

/**
 * Modal that displays on first visit to explain the AI-driven research nature of the site
 * and how to use the feedback system
 */
export default function WelcomeDisclaimerModal({ onClose }) {
  const closeButtonRef = useRef(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Move keyboard focus into the dialog on mount so screen readers
  // announce the dialog title rather than continuing to read the
  // page behind the backdrop. The 50ms defer lets the modal's
  // fade-in render before focus moves in -- without it the focus
  // ring briefly appears mid-animation and screen readers may
  // announce the close button before the dialog has fully opened.
  // This modal auto-shows on first visit so there is no prior
  // trigger to restore focus to on close; the next Tab after close
  // naturally lands on the skip-link or the first focusable
  // element in the underlying page.
  useEffect(() => {
    const t = setTimeout(() => closeButtonRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  const handleBackdropClick = (e) => {
    // Only close if clicking directly on the backdrop, not its children
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    // Prevent any clicks inside the modal from closing it
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-60"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-modal-title"
        className="max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl bg-[#EBEAE9] dark:bg-zinc-800"
        onClick={handleModalClick}
      >
        {/* Header */}
        <div className="sticky top-0 px-8 py-8 border-b-2 border-red-500 bg-[#EBEAE9] dark:bg-zinc-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 id="welcome-modal-title" className="text-black dark:text-zinc-100 text-3xl lg:text-4xl font-medium font-['Inter'] leading-tight mb-2">
                Welcome to the Civil Rights History Project
              </h2>
              <p className="text-civil-red-body text-lg lg:text-xl font-light font-['Chivo_Mono']">
                Important Information About This Research Tool
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center min-w-11 min-h-11 text-black dark:text-zinc-100 hover:text-civil-red-strong transition ml-4 flex-shrink-0"
              aria-label="Close welcome dialog"
            >
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8 space-y-8">
          {/* Research Notice */}
          <div className="border-l-4 border-red-500 pl-6 py-2">
            <h3 className="text-civil-red-strong dark:text-red-400 text-xl lg:text-2xl font-medium font-['Inter'] mb-3">
              This is a Research Project
            </h3>
            <p className="text-black dark:text-zinc-200 text-base lg:text-lg font-normal font-['Source_Serif_4'] leading-relaxed">
              This site is part of an ongoing research effort to explore how AI can help organize and make accessible important historical oral history interviews from the Civil Rights Movement.
            </p>
          </div>

          {/* AI Organization */}
          <div className="border-l-4 border-black dark:border-zinc-600 pl-6 py-2">
            <h3 className="text-black dark:text-zinc-100 text-xl lg:text-2xl font-medium font-['Inter'] mb-3">
              AI-Powered Organization
            </h3>
            <p className="text-black dark:text-zinc-200 text-base lg:text-lg font-normal font-['Source_Serif_4'] leading-relaxed">
              Our project uses artificial intelligence to organize the interviews into <span className="text-civil-red-strong dark:text-red-400 font-medium">thematic chapters</span>, each with its own set of summaries, keywords, and descriptions. This allows you to navigate through hours of interviews by topic rather than having to watch everything linearly.
            </p>
          </div>

          {/* Error Notice */}
          <div className="border-2 border-red-500 p-6">
            <h3 className="text-civil-red-strong dark:text-red-400 text-xl lg:text-2xl font-medium font-['Inter'] mb-3">
              AI Content May Contain Errors
            </h3>
            <div className="text-black dark:text-zinc-200 text-base lg:text-lg font-normal font-['Source_Serif_4'] leading-relaxed space-y-3">
              <p>
                Because this content is AI-generated, it is <span className="font-medium">subject to errors and inaccuracies</span>. The AI may:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start">
                  <span className="text-civil-red-strong dark:text-red-400 mr-3 mt-1.5">•</span>
                  <span>Misinterpret spoken words or context</span>
                </li>
                <li className="flex items-start">
                  <span className="text-civil-red-strong dark:text-red-400 mr-3 mt-1.5">•</span>
                  <span>Create summaries that miss important nuances</span>
                </li>
                <li className="flex items-start">
                  <span className="text-civil-red-strong dark:text-red-400 mr-3 mt-1.5">•</span>
                  <span>Assign keywords or themes that aren&apos;t quite right</span>
                </li>
                <li className="flex items-start">
                  <span className="text-civil-red-strong dark:text-red-400 mr-3 mt-1.5">•</span>
                  <span>Make other mistakes in organization or description</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feedback System */}
          <div className="border-2 border-black dark:border-zinc-600 p-6">
            <h3 className="text-black dark:text-zinc-100 text-xl lg:text-2xl font-medium font-['Inter'] mb-3">
              Help Us Improve: Use the Feedback System
            </h3>
            <div className="text-black dark:text-zinc-200 text-base lg:text-lg font-normal font-['Source_Serif_4'] leading-relaxed space-y-4">
              <p>
                <span className="text-civil-red-strong dark:text-red-400 font-medium">We need your help!</span> When you spot an error or inaccuracy, you can report it:
              </p>
              <ol className="space-y-3 ml-6">
                <li className="flex items-start">
                  <span className="text-civil-red-strong dark:text-red-400 font-light font-['Chivo_Mono'] mr-3 flex-shrink-0">1.</span>
                  <span><span className="font-medium">Select any text</span> on the page that contains an error</span>
                </li>
                <li className="flex items-start">
                  <span className="text-civil-red-strong dark:text-red-400 font-light font-['Chivo_Mono'] mr-3 flex-shrink-0">2.</span>
                  <span><span className="font-medium">Click the feedback button</span> that appears</span>
                </li>
                <li className="flex items-start">
                  <span className="text-civil-red-strong dark:text-red-400 font-light font-['Chivo_Mono'] mr-3 flex-shrink-0">3.</span>
                  <span><span className="font-medium">Describe the issue</span>, tell us what&apos;s wrong or inaccurate</span>
                </li>
                <li className="flex items-start">
                  <span className="text-civil-red-strong dark:text-red-400 font-light font-['Chivo_Mono'] mr-3 flex-shrink-0">4.</span>
                  <span><span className="font-medium">Submit your feedback</span> to help us improve the accuracy</span>
                </li>
              </ol>
              <p className="text-sm italic pt-2">
                Your feedback helps us understand where the AI needs improvement and allows us to make corrections to provide a more accurate resource for everyone.
              </p>
            </div>
          </div>

          {/* Closing Note */}
          <div className="text-center py-4">
            <p className="text-black dark:text-zinc-200 text-base lg:text-lg font-normal font-['Source_Serif_4'] leading-relaxed max-w-2xl mx-auto">
              Thank you for your understanding and for helping us improve this resource. We&apos;re committed to creating a valuable tool for exploring Civil Rights history.
            </p>
          </div>
        </div>

        {/* Footer / Action Button */}
        <div className="sticky bottom-0 px-8 py-6 border-t-2 border-red-500 bg-[#EBEAE9] dark:bg-zinc-800">
          <button
            onClick={onClose}
            className="w-full px-8 py-4 border-2 border-civil-red-strong dark:border-red-400 text-civil-red-strong dark:text-red-400 text-lg lg:text-xl font-light font-['Chivo_Mono'] hover:bg-civil-red-strong hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-colors"
          >
            I Understand, Continue to Site
          </button>
        </div>
      </div>
    </div>
  );
}

