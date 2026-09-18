import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthGate from './components/AuthGate';
import Layout from './components/Layout';
import { FacetsProvider } from './FacetsContext';
import { StatusProvider } from './StatusContext';
import Overview from './pages/Overview';
import Search from './pages/Search';
import Movies from './pages/Movies';
import MovieDetail from './pages/MovieDetail';
import Singers from './pages/Singers';
import SingerDetail from './pages/SingerDetail';
import MusicDirectors from './pages/MusicDirectors';
import MusicDirectorDetail from './pages/MusicDirectorDetail';
import Songwriters from './pages/Songwriters';
import SongwriterDetail from './pages/SongwriterDetail';
import Moods from './pages/Moods';
import Dayparts from './pages/Dayparts';
import ContentTypes from './pages/ContentTypes';
import Years from './pages/Years';
import YearDetail from './pages/YearDetail';
import Queue from './pages/Queue';
import Schedule from './pages/Schedule';
import BroadcastLog from './pages/BroadcastLog';

export default function App() {
  return (
    <AuthGate>
      <FacetsProvider>
        <StatusProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Overview />} />
                <Route path="search" element={<Search />} />
                <Route path="movies" element={<Movies />} />
                <Route path="movies/:id" element={<MovieDetail />} />
                <Route path="singers" element={<Singers />} />
                <Route path="singers/:id" element={<SingerDetail />} />
                <Route path="music-directors" element={<MusicDirectors />} />
                <Route path="music-directors/:id" element={<MusicDirectorDetail />} />
                <Route path="songwriters" element={<Songwriters />} />
                <Route path="songwriters/:id" element={<SongwriterDetail />} />
                <Route path="moods" element={<Moods />} />
                <Route path="dayparts" element={<Dayparts />} />
                <Route path="content-types" element={<ContentTypes />} />
                <Route path="years" element={<Years />} />
                <Route path="years/:year" element={<YearDetail />} />
                <Route path="queue" element={<Queue />} />
                <Route path="schedule" element={<Schedule />} />
                <Route path="broadcast-log" element={<BroadcastLog />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </StatusProvider>
      </FacetsProvider>
    </AuthGate>
  );
}
