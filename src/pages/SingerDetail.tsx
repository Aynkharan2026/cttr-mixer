import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import EntityDetail from '../components/EntityDetail';
import { api } from '../api';

export default function SingerDetail() {
  const { id } = useParams<{ id: string }>();
  const singerId = Number(id);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    api.singerTracks(singerId, { limit: 1, offset: 0 }).then((res) => setName(res.singer.name));
  }, [singerId]);

  return (
    <EntityDetail
      backPath="/singers"
      backLabel="பாடகர்கள்"
      headerName={name}
      fetcher={(params) => api.singerTracks(singerId, params)}
    />
  );
}
