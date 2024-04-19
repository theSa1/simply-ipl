import { Data } from "@/App";
import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import useStateRef from "react-usestateref";
import posthog from "posthog-js";

export const useIpl = (data: Data) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isFullScreen, setIsFullScreen, isFullScreenRef] = useStateRef(false);
  const [isPlaying, setIsPlaying, isPlayingRef] = useStateRef(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hls, setHls] = useState<Hls>();

  const [isControlsVisible, setIsControlsVisible, isControlsVisibleRef] =
    useStateRef(true);
  const [
    isQualitySelectorVisible,
    setIsQualitySelectorVisible,
    isQualitySelectorVisibleRef,
  ] = useStateRef(false);
  const [
    isLanguageSelectorVisible,
    setIsLanguageSelectorVisible,
    isLanguageSelectorVisibleRef,
  ] = useStateRef(false);

  const [isLoaderVisible, setIsLoaderVisible] = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);

  const [availableQualities, setAvailableQualities] = useState<number[]>([
    360, 720, 1080,
  ]);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);

  const [availableLanguages] = useState<string[]>(
    data.languages.map((lang) => lang.language)
  );
  const [selectedLanguage, setSelectedLanguage] = useState<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleOrientationChange = () => {
      if (window.innerHeight > window.innerWidth) {
        setIsLandscape(false);
        posthog.capture("Orientation", { orientation: "Portrait" });
      } else {
        setIsLandscape(true);
        posthog.capture("Orientation", { orientation: "Landscape" });
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      posthog.capture("Play/Pause", { action: "Play" });
    };

    const handlePause = () => {
      setIsPlaying(false);
      posthog.capture("Play/Pause", { action: "Pause" });
    };

    const handleMute = () => {
      setIsMuted(video.muted);
      posthog.capture("Mute/Unmute", {
        action: video.muted ? "Mute" : "Unmute",
      });
    };

    const handleFullscreenChange = () => {
      setIsFullScreen(document.fullscreenElement !== null);
      posthog.capture("Fullscreen", {
        action: isFullScreen ? "Enter" : "Exit",
      });
    };

    let ControlsVisibilityTimeout: NodeJS.Timeout;

    const handleTimeout = () => {
      if (isControlsVisibleRef.current) {
        if (
          !isQualitySelectorVisibleRef.current &&
          !isLanguageSelectorVisibleRef.current
        ) {
          setIsControlsVisible(false);
        }
      }
    };

    const handleMouseMove = () => {
      if (!("ontouchstart" in window)) return;

      setIsControlsVisible(true);
      clearTimeout(ControlsVisibilityTimeout);

      ControlsVisibilityTimeout = setTimeout(handleTimeout, 3000);
    };

    const handleTouch = () => {
      if (
        isQualitySelectorVisibleRef.current ||
        isLanguageSelectorVisibleRef.current
      )
        return;

      clearTimeout(ControlsVisibilityTimeout);
      if (isControlsVisibleRef.current) {
        setIsControlsVisible(false);
      } else {
        ControlsVisibilityTimeout = setTimeout(handleTimeout, 3000);
        setIsControlsVisible(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " ") {
        if (isPlayingRef.current) {
          video.pause();
        } else {
          video.play();
        }
      } else if (e.key === "m") {
        mute();
      } else if (e.key === "f") {
        fullscreen();
      } else if (e.key === "ArrowRight") {
        video.currentTime += 5;
      } else if (e.key === "ArrowLeft") {
        video.currentTime -= 5;
      }
    };

    handleOrientationChange();

    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("touchend", handleTouch);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("volumechange", handleMute);
    video.addEventListener("mousemove", handleMouseMove);

    setupHls();

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("volumechange", handleMute);
    };
  }, []);

  const setupHls = () => {
    if (!videoRef.current) return;
    if (!Hls.isSupported()) {
      console.error("HLS is not supported");
      alert("HLS is not supported");
      return;
    }

    const hls = new Hls();

    setHls(hls);

    hls.attachMedia(videoRef.current);

    hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
      setAvailableQualities(data.levels.map((level) => level.height));
      setSelectedQuality(-1);
      setCurrentQuality(data.firstLevel);
    });

    hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
      setCurrentQuality(data.level);
    });

    hls.on(Hls.Events.ERROR, (_, { details }) => {
      if (details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
        setIsLoaderVisible(true);
      }
    });

    hls.on(Hls.Events.FRAG_BUFFERED, () => {
      setIsLoaderVisible(false);
    });

    hls?.loadSource(data.languages[selectedLanguage].url);
  };

  const handleLanguageChange = () => {
    hls?.loadSource(data.languages[selectedLanguage].url);
    posthog.capture("Language", {
      language: data.languages[selectedLanguage].language,
    });
  };

  const handleQualityChange = () => {
    if (!hls) return;
    hls.currentLevel = selectedQuality;
    posthog.capture("Quality", {
      quality: availableQualities[selectedQuality].toString(),
    });
  };

  useEffect(() => {
    handleLanguageChange();
    setIsLoaderVisible(true);
  }, [selectedLanguage]);

  useEffect(() => {
    handleQualityChange();
    if (selectedQuality !== -1) setIsLoaderVisible(true);
  }, [selectedQuality]);

  useEffect(() => {
    if (!isControlsVisible) {
      document.body.style.cursor = "none";
    } else {
      document.body.style.cursor = "auto";
    }
  }, [isControlsVisible]);

  const mute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
  };

  const fullscreen = () => {
    if (!videoRef.current) return;
    if (isFullScreenRef.current) {
      document.exitFullscreen();
    } else {
      document.getElementById("body")?.requestFullscreen();
    }
  };

  const goLive = () => {
    if (!videoRef.current) return;

    setIsLoaderVisible(true);
    videoRef.current.currentTime = videoRef.current.duration;
  };

  return {
    videoRef,
    isFullScreen,
    isPlaying,
    isMuted,
    isControlsVisible,
    isQualitySelectorVisible,
    setIsQualitySelectorVisible,
    isLanguageSelectorVisible,
    setIsLanguageSelectorVisible,
    isLoaderVisible,
    isLandscape,
    availableQualities,
    selectedQuality,
    setSelectedQuality,
    availableLanguages,
    selectedLanguage,
    setSelectedLanguage,
    mute,
    fullscreen,
    currentQuality,
    goLive,
  };
};
