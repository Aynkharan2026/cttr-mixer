import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import EntityDetail from '../components/EntityDetail';
import { api } from '../api';

export default function MusicDirectorDetail() {
  const { id } = useParams<{ id: string }>();
  const musicDirectorId = Number(id);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    api.musicDirectorTracks(musicDirectorId, { limit: 1, offset: 0 }).then((res) => setName(res.music_director.name));
  }, [musicDirectorId]);

  return (
    <EntityDetail
      backPath="/music-directors"
      backLabel="இசையமைப்பாளர்கள்"
      headerName={name}
      fetcher={(params) => api.musicDirectorTracks(musicDirectorId, params)}
    />
  );
}
