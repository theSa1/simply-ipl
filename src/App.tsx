import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import { PlayIcon } from "./icons/play";
import { PauseIcon } from "./icons/pause";
import { MuteIcon } from "./icons/mute";
import { UnmuteIcon } from "./icons/unmute";
import { FullscreenIcon } from "./icons/fullscreen";
import { ExitFullscreenIcon } from "./icons/exit-fullscreen";
import useRefState from "react-usestateref";
import { cn } from "./lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { PIPIcon } from "./icons/pip-icon";

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isControlsVisible, setIsControlsVisible, isControlsVisibleRef] =
    useRefState(true);
  const [quality, setQuality] = useState(0);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1);
  const [availableQualities, setAvailableQualities] = useState<number[]>([]);
  const [isQualityMenuOpen, setIsQualityMenuOpen, isQualityMenuOpenRef] =
    useRefState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen, isLanguageMenuOpenRef] =
    useRefState(false);
  const [data, setData] = useState<{
    thumbnail: string;
    title: string;
    languages: {
      language: string;
      url: string;
      isDefault?: boolean;
    }[];
  }>();
  const [selectedLanguage, setSelectedLanguage] = useState<number>(0);
  const [hls, setHls] = useState<Hls>();
  const [isLandscape, setIsLandscape] = useState(true);

  useEffect(() => {
    loadData();

    const config = {
      enableWorker: true,
      maxBufferLength: 1,
      liveBackBufferLength: 0,
      liveSyncDuration: 0,
      liveMaxLatencyDuration: 5,
      liveDurationInfinity: true,
      highBufferWatchdogPeriod: 1,
    };

    const hls = new Hls(config);

    setHls(hls);

    if (Hls.isSupported() && videoRef.current) {
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.LEVEL_LOADED, () => {
        console.log(hls.levels);
        setAvailableQualities(hls.levels.map((level) => level.height));
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play();
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setQuality(data.level);
      });
      hls.on(Hls.Events.ERROR, (err) => {
        console.log(err);
      });
    } else {
      console.error("HLS is not supported");
    }

    window.addEventListener("fullscreenchange", () => {
      if (document.fullscreenElement) {
        setIsFullScreen(true);
      } else {
        setIsFullScreen(false);
      }
    });

    videoRef.current?.addEventListener("play", () => {
      setIsPlaying(true);
    });

    videoRef.current?.addEventListener("pause", () => {
      setIsPlaying(false);
    });

    videoRef.current?.addEventListener("volumechange", () => {
      if (videoRef.current?.muted) {
        setIsMuted(true);
      } else {
        setIsMuted(false);
      }
    });

    let timeout: NodeJS.Timeout;

    const timeoutHandler = () => {
      if (isQualityMenuOpenRef.current || isLanguageMenuOpenRef.current) {
        setIsControlsVisible(true);
        timeout = setTimeout(timeoutHandler, 3000);
      } else {
        setIsControlsVisible(false);
      }
    };

    timeout = setTimeout(timeoutHandler, 3000);

    window.addEventListener("touchend", () => {
      console.log("touch");
      if (isQualityMenuOpenRef.current || isLanguageMenuOpenRef.current)
        return true;
      if (isControlsVisibleRef.current) {
        console.log("visible");
        clearTimeout(timeout);
        setIsControlsVisible(false);
      } else {
        console.log("not visible");
        clearTimeout(timeout);
        timeout = setTimeout(timeoutHandler, 3000);
        setIsControlsVisible(true);
      }
    });

    window.addEventListener("mousemove", () => {
      if (window.matchMedia("(pointer: coarse)").matches) return;

      setIsControlsVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(timeoutHandler, 3000);
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === " ") {
        setIsPlaying((prev) => !prev);
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerHeight < window.innerWidth) {
        setIsLandscape(true);
      } else {
        setIsLandscape(false);
      }
    });

    return () => {
      hls.destroy();
    };
  }, []);

  useEffect(() => {
    if (!hls) return;

    hls.currentLevel = selectedQuality;
  }, [selectedQuality]);

  useEffect(() => {
    if (!isControlsVisible) {
      document.body.style.cursor = "none";
    } else {
      document.body.style.cursor = "auto";
    }
  }, [isControlsVisible]);

  useEffect(() => {
    if (!data || !hls) return;

    document.title = data.title;

    const defaultLanguage = data.languages.find((lang, i) => {
      if (lang.isDefault) {
        setSelectedLanguage(i);
        return true;
      }
    });

    if (defaultLanguage) {
      hls.loadSource(defaultLanguage.url);
    } else {
      hls.loadSource(data.languages[0].url);
    }
  }, [data]);

  useEffect(() => {
    if (!data || !hls) return;

    hls.loadSource(data.languages[selectedLanguage].url);
  }, [selectedLanguage]);

  const loadData = async () => {
    const res = await fetch("https://api.npoint.io/5e080f808be4635d9e7b");
    const data = await res.json();
    setData(data);
  };

  const fullScreen = () => {
    if (!isFullScreen) {
      document.getElementById("body")?.requestFullscreen({
        navigationUI: "hide",
      });
      screen.orientation.lock("landscape");
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      screen.orientation.unlock();
      setIsFullScreen(false);
    }
  };

  const mute = () => {
    if (!videoRef.current) return;
    if (!isMuted) {
      videoRef.current.muted = true;
      setIsMuted(true);
    } else {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-black relative dark">
      <video
        width="320"
        height="240"
        autoPlay
        muted
        ref={videoRef}
        className="h-full w-full"
        poster={data?.thumbnail}
      />
      {/* Contrals */}
      <div
        className={cn(
          "controls-bg",
          isControlsVisible ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 flex justify-between items-center px-5 z-10 h-14 transition-opacity",
          isControlsVisible ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="flex items-center space-x-4">
          {isPlaying ? (
            <PauseIcon
              className="h-8 w-8 transition-opacity text-white opacity-75 hover:opacity-100 cursor-pointer"
              onClick={() => setIsPlaying(false)}
            />
          ) : (
            <PlayIcon
              className="h-8 w-8 transition-opacity text-white opacity-75 hover:opacity-100 cursor-pointer"
              onClick={() => setIsPlaying(true)}
            />
          )}
          <div className="flex items-center gap-3 opacity-75 hover:opacity-100 transition-opacity cursor-pointer">
            <div className="bg-red-600 h-2 w-2 rounded-full" />
            <p className="text-white leading-none">Live</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {data && (
            <div>
              <DropdownMenu
                onOpenChange={setIsLanguageMenuOpen}
                open={isLanguageMenuOpen}
              >
                <DropdownMenuTrigger asChild>
                  <p className="text-white cursor-pointer opacity-75 hover:opacity-100 transition-opacity">
                    {data.languages[selectedLanguage].language}
                  </p>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className={cn(
                    "w-48 transition-opacity h-60 overflow-scroll",
                    isControlsVisible ? "opacity-100" : "opacity-0"
                  )}
                >
                  <DropdownMenuLabel>Languages</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {data.languages.map((language, i) => (
                    <DropdownMenuCheckboxItem
                      key={language.language}
                      checked={selectedLanguage === i}
                      onCheckedChange={() => setSelectedLanguage(i)}
                    >
                      {language.language}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          <div>
            <DropdownMenu
              onOpenChange={setIsQualityMenuOpen}
              open={isQualityMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <p className="text-white cursor-pointer opacity-75 hover:opacity-100 transition-opacity">
                  {quality === undefined || availableQualities.length === 0
                    ? "Auto"
                    : `${availableQualities[quality]}p`}
                </p>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className={cn(
                  "w-32 transition-opacity",
                  isControlsVisible ? "opacity-100" : "opacity-0"
                )}
              >
                <DropdownMenuLabel>Quality</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={selectedQuality === -1}
                  onCheckedChange={() => setSelectedQuality(-1)}
                >
                  Auto
                </DropdownMenuCheckboxItem>
                {availableQualities.map((q, i) => (
                  <DropdownMenuCheckboxItem
                    key={q}
                    checked={selectedQuality === i}
                    onCheckedChange={() => setSelectedQuality(i)}
                  >
                    {q}p
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {isLandscape && videoRef.current?.requestPictureInPicture && (
            <PIPIcon
              className="h-8 w-8 transition-opacity text-white opacity-75 hover:opacity-100 cursor-pointer"
              onClick={() => {
                videoRef.current?.requestPictureInPicture();
              }}
            />
          )}
          {isMuted ? (
            <MuteIcon
              className="h-8 w-8 transition-opacity text-white opacity-75 hover:opacity-100 cursor-pointer"
              onClick={mute}
            />
          ) : (
            <UnmuteIcon
              className="h-8 w-8 transition-opacity text-white opacity-75 hover:opacity-100 cursor-pointer"
              onClick={mute}
            />
          )}
          {isFullScreen ? (
            <ExitFullscreenIcon
              className="h-8 w-8 transition-opacity text-white opacity-75 hover:opacity-100 cursor-pointer"
              onClick={fullScreen}
            />
          ) : (
            <FullscreenIcon
              className="h-8 w-8 transition-opacity text-white opacity-75 hover:opacity-100 cursor-pointer"
              onClick={fullScreen}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
