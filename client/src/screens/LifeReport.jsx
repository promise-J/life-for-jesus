import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ENDING_PASSAGES } from '@lfj/shared';
import { Api } from '../api/client.js';
import { Button, ErrorNote, Spinner } from '../components/ui.jsx';
import { ReportView } from '../components/ReportView.jsx';
import { ScriptureCard } from '../components/ScriptureCard.jsx';

export function LifeReportScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [showScripture, setShowScripture] = useState(false);
  useEffect(() => {
    Api.report(id).then(setData).catch(setError);
  }, [id]);
  return (
    <main className="adire-bg min-h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="paper" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft className="w-5 h-5" /></Button>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-paper">{data ? `${data.report.name}: ${data.ended ? 'a life report' : 'life so far'}` : 'Life report'}</h1>
        </div>
        <div className="sticker bg-paper rounded-3xl p-5">
          <ErrorNote error={error} />
          {!data && !error && <Spinner label="Loading…" />}
          {data && <ReportView report={data.report} ended={data.ended} />}
          {data?.ended && (
            <div className="mt-4">
              <Button variant="paper" onClick={() => setShowScripture((s) => !s)}>{showScripture ? 'Hide' : 'Read'} the Scripture from the ending</Button>
              {showScripture && ENDING_PASSAGES.map((p) => <ScriptureCard key={p.ref} refText={p.ref} />)}
            </div>
          )}
          <div className="flex gap-2 flex-wrap mt-5">
            <Button onClick={() => navigate('/new')}>Start a new life</Button>
            {data && !data.ended && <Button variant="paper" onClick={() => navigate(`/play/${id}`)}>Back to the game</Button>}
            <Button variant="indigo" onClick={() => navigate('/')}>Main menu</Button>
          </div>
        </div>
      </div>
    </main>
  );
}
