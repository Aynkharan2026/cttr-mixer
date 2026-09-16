import EntityBrowse from '../components/EntityBrowse';
import { api } from '../api';

export default function Songwriters() {
  return <EntityBrowse title="பாடலாசிரியர்" basePath="/songwriters" fetcher={api.songwriters} />;
}
