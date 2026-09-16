import { useParams } from 'react-router-dom';
import EntityDetail from '../components/EntityDetail';
import { api } from '../api';

export default function YearDetail() {
  const { year } = useParams<{ year: string }>();
  const yearNum = Number(year);

  return (
    <EntityDetail
      backPath="/years"
      backLabel="ஆண்டுகள்"
      headerName={year ?? null}
      fetcher={(params) => api.yearTracks(yearNum, params)}
    />
  );
}
