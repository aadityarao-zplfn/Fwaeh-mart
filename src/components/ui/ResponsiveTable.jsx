export const ResponsiveTable = ({ columns, data }) => {
  return (
    <>
      {/* Desktop view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y" style={{ borderColor: '#fca5a5' }}>
          <thead style={{ background: '#fff5f5' }}>
            <tr>
              {columns.map((col, i) => (
                <th 
                  key={i} 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: '#b91c1c', borderColor: '#fca5a5' }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: '#fca5a5', background: '#ffffff' }}>
            {data.map((row, i) => (
              <tr 
                key={i}
                className="transition-colors hover:bg-rose-50"
                style={{ borderColor: '#fca5a5' }}
              >
                {columns.map((col, j) => (
                  <td 
                    key={j} 
                    className="px-6 py-4 whitespace-nowrap text-sm"
                    style={{ color: '#b91c1c', borderColor: '#fca5a5' }}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile view - Cards */}
      <div className="md:hidden space-y-4">
        {data.map((row, i) => (
          <div 
            key={i} 
            className="p-4 rounded-xl shadow-lg transition-all hover:shadow-xl"
            style={{
              background: 'linear-gradient(to bottom, #fff5f5, #ffe8e8)',
              border: '2px solid #fca5a5'
            }}
          >
            {columns.map((col, j) => (
              <div 
                key={j} 
                className="flex justify-between py-3 border-b last:border-b-0"
                style={{ borderColor: '#fca5a5' }}
              >
                <span 
                  className="font-semibold"
                  style={{ color: '#dc2626' }}
                >
                  {col.header}:
                </span>
                <span 
                  className="text-right"
                  style={{ color: '#b91c1c' }}
                >
                  {col.cell(row)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
};