const CallOut = ({ header, children }: { header: string; children: React.ReactNode }) => (
  <div className="bg-teal-50 dark:bg-teal-900/20 border-l-4 border-teal-500 p-6 my-8 rounded-r-lg">
    <div className="flex items-start gap-4">
    <div className="text-teal-500 text-2xl">💡</div>
    <div>
      <h4 className="font-semibold text-lg mb-2 text-teal-800 dark:text-teal-200">{header}</h4>
      <span className="text-teal-700 dark:text-teal-300">{children}</span>
    </div>
    </div>
  </div>
);

export default CallOut;