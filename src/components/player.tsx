import { Data } from "@/App";
import { PlayIcon } from "@/icons/play";
import { PauseIcon } from "@/icons/pause";
import { MuteIcon } from "@/icons/mute";
import { UnmuteIcon } from "@/icons/unmute";
import { FullscreenIcon } from "@/icons/fullscreen";
import { ExitFullscreenIcon } from "@/icons/exit-fullscreen";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PIPIcon } from "@/icons/pip-icon";
import { LoadingSpinner } from "./ui/loading-spinner";
import { useIpl } from "@/hooks/useIpl";

export const Player = ({ data }: { data: Data }) => {
  const {
    isControlsVisible,
    isFullScreen,
    isLandscape,
    isLanguageSelectorVisible,
    isLoaderVisible,
    isMuted,
    isPlaying,
    isQualitySelectorVisible,
    setIsLanguageSelectorVisible,
    setIsQualitySelectorVisible,
    videoRef,
    availableLanguages,
    availableQualities,
    selectedLanguage,
    selectedQuality,
    setSelectedLanguage,
    setSelectedQuality,
    mute,
    fullscreen,
    currentQuality,
    goLive,
  } = useIpl(data);

  return (
    <div className="h-screen w-screen bg-black relative dark text-sm">
      <video
        width="320"
        height="240"
        autoPlay
        muted
        ref={videoRef}
        className="h-full w-full"
        poster={data?.thumbnail}
      />
      {isLoaderVisible && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <LoadingSpinner />
        </div>
      )}
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
          isControlsVisible ? "opacity-100" : "opacity-0 hidden"
        )}
      >
        <div className="flex items-center space-x-4">
          {isPlaying ? (
            <PauseIcon
              className="h-6 w-6 transition-opacity text-white opacity-75 hover:opacity-100 cursor-pointer"
              onClick={() => {
                videoRef.current?.pause();
              }}
            />
          ) : (
            <PlayIcon
              className="h-6 w-6 transition-opacity text-white opacity-75 hover:opacity-100 cursor-pointer"
              onClick={() => {
                videoRef.current?.play();
              }}
            />
          )}
          <div
            className="flex items-center gap-3 opacity-75 hover:opacity-100 transition-opacity cursor-pointer"
            onClick={goLive}
          >
            <div className="bg-red-600 h-2 w-2 rounded-full" />
            <p className="text-white leading-none">Live</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {data && (
            <div>
              <DropdownMenu
                onOpenChange={setIsLanguageSelectorVisible}
                open={isLanguageSelectorVisible}
              >
                <DropdownMenuTrigger asChild>
                  <p className="text-white cursor-pointer opacity-75 hover:opacity-100 transition-opacity">
                    {availableLanguages[selectedLanguage]}
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
                  {availableLanguages.map((language, i) => (
                    <DropdownMenuCheckboxItem
                      key={language}
                      checked={selectedLanguage === i}
                      onCheckedChange={() => setSelectedLanguage(i)}
                    >
                      {language}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          <div>
            <DropdownMenu
              onOpenChange={setIsQualitySelectorVisible}
              open={isQualitySelectorVisible}
            >
              <DropdownMenuTrigger asChild>
                <p className="text-white cursor-pointer opacity-75 hover:opacity-100 transition-opacity">
                  {currentQuality === -1 || availableQualities.length === 0
                    ? "Auto"
                    : `${availableQualities[currentQuality]}p`}
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
              className="h-6 w-6 transition-opacity text-white opacity-75 hover:opacity-100 cursor-pointer"
              onClick={() => {
                videoRef.current?.requestPictureInPicture();
              }}
            />
          )}
          {isMuted ? (
            <MuteIcon
              className="h-6 w-6 transition-opacity text-white opacity-75 hover:opacity-100 cursor-pointer"
              onClick={mute}
            />
          ) : (
            <UnmuteIcon
              className="h-6 w-6 transition-opacity text-white opacity-75 hover:opacity-100 cursor-pointer"
              onClick={mute}
            />
          )}
          {isFullScreen ? (
            <ExitFullscreenIcon
              className="h-6 w-6 transition-opacity text-white opacity-75 hover:opacity-100 cursor-pointer"
              onClick={fullscreen}
            />
          ) : (
            <FullscreenIcon
              className="h-6 w-6 transition-opacity text-white opacity-75 hover:opacity-100 cursor-pointer"
              onClick={fullscreen}
            />
          )}
        </div>
      </div>
    </div>
  );
};
