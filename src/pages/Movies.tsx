import EntityBrowse from '../components/EntityBrowse';
import { api } from '../api';

export default function Movies() {
  return <EntityBrowse title="திரைப்படம்" basePath="/movies" fetcher={api.movies} showYear />;
}
