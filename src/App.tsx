import { useEffect, useState } from "react";
import { Player } from "./components/player";
import { LoadingSpinner } from "./components/ui/loading-spinner";

export type Data = {
  thumbnail: string;
  title: string;
  languages: {
    language: string;
    url: string;
    isDefault?: boolean;
  }[];
};

function App() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const response = await fetch("https://api.npoint.io/5e080f808be4635d9e7b");
    const data = await response.json();
    setData(data);
  };

  return (
    <>
      {data ? (
        <Player data={data} />
      ) : (
        <div className="h-screen w-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
    </>
  );
}

export default App;
