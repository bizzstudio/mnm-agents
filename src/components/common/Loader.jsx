const Loader = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-10 gap-3">
    <div className="w-10 h-10 rounded-full border-4 border-brand/20 border-t-brand animate-spin" />
    {label && <p className="text-sm text-gray-500">{label}</p>}
  </div>
);

export default Loader;
