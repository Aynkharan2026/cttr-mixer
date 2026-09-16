import EntityBrowse from '../components/EntityBrowse';
import { api } from '../api';

export default function Singers() {
  return <EntityBrowse title="பாடகர்" basePath="/singers" fetcher={api.singers} />;
}
