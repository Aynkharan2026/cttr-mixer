import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import EntityDetail from '../components/EntityDetail';
import { api } from '../api';

export default function SongwriterDetail() {
  const { id } = useParams<{ id: string }>();
  const songwriterId = Number(id);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    api.songwriterTracks(songwriterId, { limit: 1, offset: 0 }).then((res) => setName(res.songwriter.name));
  }, [songwriterId]);

  return (
    <EntityDetail
      backPath="/songwriters"
      backLabel="பாடலாசிரியர்கள்"
      headerName={name}
      fetcher={(params) => api.songwriterTracks(songwriterId, params)}
    />
  );
}
