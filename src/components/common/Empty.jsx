const Empty = ({ title, description }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center text-gray-500">
    <div className="w-16 h-16 rounded-full bg-gray-100 mb-3" />
    <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
    {description && <p className="text-sm mt-1">{description}</p>}
  </div>
);

export default Empty;
