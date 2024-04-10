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
  const [hls, setHls] = useState<Hls>();

  useEffect(() => {
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
      hls.loadSource(
        "https://prod-sports-north.jiocinema.com/hls/live/2109750/hd_akamai_iosmob_avc_guj_ipl_s1_m1090424/master.m3u8"
      );
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.LEVEL_LOADED, () => {
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
      if (isQualityMenuOpenRef.current) {
        setIsControlsVisible(true);
        timeout = setTimeout(timeoutHandler, 3000);
      } else {
        setIsControlsVisible(false);
      }
    };

    timeout = setTimeout(timeoutHandler, 3000);

    window.addEventListener("touchend", () => {
      console.log("touch");
      if (isQualityMenuOpenRef.current) return true;
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
    <div className="h-screen w-screen bg-zinc-950 relative dark">
      <video
        width="320"
        height="240"
        autoPlay
        muted
        ref={videoRef}
        className="h-full w-full"
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
          <div>
            <DropdownMenu
              onOpenChange={setIsQualityMenuOpen}
              open={isQualityMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <p className="text-white cursor-pointer opacity-75 hover:opacity-100 transition-opacity">
                  {availableQualities[quality]}
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
