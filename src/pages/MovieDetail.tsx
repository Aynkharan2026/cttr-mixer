import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import EntityDetail from '../components/EntityDetail';
import { api } from '../api';

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const movieId = Number(id);
  const [name, setName] = useState<string | null>(null);
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    api.movieTracks(movieId, { limit: 1, offset: 0 }).then((res) => {
      setName(res.movie.name);
      setYear(res.movie.year);
    });
  }, [movieId]);

  return (
    <EntityDetail
      backPath="/movies"
      backLabel="திரைப்படங்கள்"
      headerName={name}
      headerSub={year ? String(year) : undefined}
      fetcher={(params) => api.movieTracks(movieId, params)}
    />
  );
}
