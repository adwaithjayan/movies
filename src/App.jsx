import React, { useEffect, useState } from 'react'
import { useDebounce } from 'react-use';
import Search from './components/Search'
import Spinner from './components/Spinner';
import MoiveCard from './components/moiveCard';
import { getTrendingMovies, updateSearchCount } from './appwrite';

const API_URL='https://api.themoviedb.org/3';
const API_KEY=import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS={
  method:'GET',
  headers:{
    accept:'application/json',
    Authorization:`Bearer ${API_KEY}`
  }
}

export default function App() {
  const [searchTerm,setSearchTerm] = useState('');
  const [moviesList,setMoviesList] = useState([]);
  const [loading,setLoading] = useState(false);
  const [errorMsg,setErrorMsg] = useState(' ');
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [debouncedSearchTerm,setDebouncedSearchTerm] = useState('');

  useDebounce(() => {
    setDebouncedSearchTerm(searchTerm);
  }, 500, [searchTerm]);

  const featchMovies =async (query='')=>{
    setLoading(true);
    setErrorMsg('');
    try{
      const endPoint =query? `${API_URL}/search/movie?query=${encodeURIComponent(query)}`: `${API_URL}/discover/movie?sort_by=popularity.desc`
      const res =await fetch(endPoint,API_OPTIONS);
      if(!res.ok){
        throw new Error(`Fail to fetch`);
      }
      const data = await res.json();
      if(data.Response==='False'){
        setErrorMsg('No movies found');
        setMoviesList([]);
        return;
      }
      setMoviesList(data.results || []);
      if(query && data.results.length>0){
        await updateSearchCount(query,data.results[0]);
      }
    }
    catch(error){
      console.error('Error fetching movies:',error);
      setErrorMsg('An error occurred while fetching movies. Please try again later.');
    }
    finally{
      setLoading(false);
    }
  }

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();

      setTrendingMovies(movies);
    } catch (error) {
      console.error(`Error fetching trending movies: ${error}`);
    }
  }

  useEffect(() =>{
    featchMovies(debouncedSearchTerm);
  },[debouncedSearchTerm])

  useEffect(() => {
    loadTrendingMovies();
  }, []);
  return (
    <main>
      <div className='pattern'/>
      <div className='wrapper'>
        <header>
          <img src='/hero.png' alt='hero image'/>
          <h1>Find <span className='text-gradient'>Movies</span> You&apos;ll Enjoy Without the Hassle</h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
        </header>


        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>

            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}


        <section className="all-movies">
          <h2>All Movies</h2>

          {loading ? (
            <Spinner />
          ) : errorMsg ? (
            <p className="text-red-500">{errorMsg}</p>
          ) : (
            <ul>
              {moviesList.map((movie) => (
                <MoiveCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
