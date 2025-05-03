// app/test/page.js
import { supabase } from '@/lib/supabaseClient'

export default async function TestPage() {
  const { data, error } = await supabase.from('test-table').select('*')

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Supabase Test: test-table</h1>
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}

      {!error && data?.length > 0 ? (
        <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.title}</td>
                <td>{row.completed ? '✅' : '❌'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No data found.</p>
      )}
    </div>
  )
}