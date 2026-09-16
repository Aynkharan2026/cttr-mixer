import EntityBrowse from '../components/EntityBrowse';
import { api } from '../api';

export default function MusicDirectors() {
  return <EntityBrowse title="இசையமைப்பாளர்" basePath="/music-directors" fetcher={api.musicDirectors} />;
}
