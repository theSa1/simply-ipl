import fs from "fs";

const MATCH_ID = "3948193";
// 3944024
// 3943969
const ACCESS_TOKEN =
  "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImF1dGhUb2tlbklkIjoiZjI4MjZkODEtNTczNy00M2MxLWI5YzktODc3YzI5ZTQ2MjEzIiwidXNlcklkIjoiODNmNTAyNTktZjkxNS00ZDg5LWI1ZWEtMWNhMTk3YjZlNzJjIiwidXNlclR5cGUiOiJOT05KSU8iLCJvcyI6IndlYiIsImRldmljZVR5cGUiOiJwYyIsImFjY2Vzc0xldmVsIjoiOSIsImRldmljZUlkIjoiNmYzMjJmNGQtMmM0Yy00Y2ZiLWExMDYtYTg2ODcxMjg5MWYyIiwiZXh0cmEiOiJ7XCJudW1iZXJcIjpcIjc3enFlbXcyWUhxcjN4NzRmNDNzL0xIREViUnhOWHRPMnBheVUrcFpDWlpCYjZpMG5Jak9NN009XCIsXCJhZHNcIjpcInllc1wiLFwicGxhbmRldGFpbHNcIjp7XCJhZHNcIjpcInllc1wiLFwiUGFja2FnZUluZm9cIjpbXX0sXCJqVG9rZW5cIjpcIlwiLFwidXNlckRldGFpbHNcIjpcIlNjQVdDQ3ptZTVJTFEwRVRpSEFPUnpKTGtZeHBDQ3VDbmduS3VNdFEySk9TMzdUY1o3UWxPZkJ0Rm10K3lNRFJkU1M0aUdkMHpoTGZWNUwzdXJTcDJlVnd1OStseCt5QU54djhiQm1LQXAzZjhhbmlpUndKTzVVWnMxZmo2M2luT3NQQlVVS3RVeWpoWkRTeFYxeTdTbjI3QWh3dGp3PT1cIn0iLCJzdWJzY3JpYmVySWQiOiIiLCJhcHBOYW1lIjoiUkpJTF9KaW9DaW5lbWEiLCJkZWdyYWRlZCI6ImZhbHNlIiwiYWRzIjoieWVzIiwicHJvZmlsZUlkIjoiMjA2ZmFkZmQtYjk3Yi00Y2RlLWE5OTYtNzIyNDJjYzIzYjBkIiwiYWRJZCI6IjZmMzIyZjRkLTJjNGMtNGNmYi1hMTA2LWE4Njg3MTI4OTFmMiIsImFkc0NvbmZpZyI6eyJpbnN0cmVhbUFkcyI6eyJsaXZlIjp7ImVuYWJsZWQiOnRydWV9LCJ2b2QiOnsiZW5hYmxlZCI6dHJ1ZX19fSwiZXhwZXJpbWVudEtleSI6eyJjb25maWdLZXkiOiIyMDZmYWRmZC1iOTdiLTRjZGUtYTk5Ni03MjI0MmNjMjNiMGQiLCJncm91cElkIjo0NzA1fSwicHJvZmlsZURldGFpbHMiOnsicHJvZmlsZVR5cGUiOiJhZHVsdCIsImNvbnRlbnRBZ2VSYXRpbmciOiJBIn0sInZlcnNpb24iOjIwMjQwMzA0MH0sImV4cCI6MTcxMzk2NzgyMCwiaWF0IjoxNzEzMzYzMDIwfQ.J4PowlWPyF7rwUBHe5o6HlWgOCulgcUw2VHK2Jnmma8z2iLrBHkRlaPZlupd9vnPUHQUj1q8Fw5zb660RvJNOg";

const main = async () => {
  const res = await fetch(
    `https://content-jiovoot.voot.com/psapi/voot/v1/voot-web/content/query/asset-details?&ids=include:${MATCH_ID}&responseType=common&devicePlatformType=desktop`
  );

  const data = await res.json();

  console.log(data);

  const title = data.result[0].fullTitle;
  const thumbnail = "https://v3img.voot.com" + data.result[0].imageUri;

  const languages = [];

  for (const language of data.result[0].assetsByLanguage) {
    const url = await getPlaybackUrl(language.assetId);

    languages.push({
      isDefault: language.id === "hi" ? true : false,
      language: language.label,
      url,
    });
  }

  fs.writeFileSync(
    `${MATCH_ID}.json`,
    JSON.stringify(
      {
        thumbnail,
        title,
        languages,
      },
      null,
      2
    )
  );
};

const getPlaybackUrl = async (id) => {
  const res = await fetch(`https://apis-jiovoot.voot.com/playbackjv/v5/${id}`, {
    method: "POST",
    body: JSON.stringify({
      "4k": false,
      ageGroup: "18+",
      appVersion: "3.4.0",
      bitrateProfile: "xhdpi",
      capability: {
        drmCapability: {
          aesSupport: "yes",
          fairPlayDrmSupport: "yes",
          playreadyDrmSupport: "none",
          widevineDRMSupport: "yes",
        },
        frameRateCapability: [
          {
            frameRateSupport: "30fps",
            videoQuality: "1440p",
          },
        ],
      },
      continueWatchingRequired: false,
      dolby: false,
      downloadRequest: false,
      hevc: false,
      kidsSafe: false,
      manufacturer: "Windows",
      model: "Windows",
      multiAudioRequired: true,
      osVersion: "10",
      parentalPinValid: true,
    }),
    headers: {
      "content-type": "application/json",
      "x-platform": "androidweb",
      accesstoken: ACCESS_TOKEN,
    },
  });

  const data = await res.json();

  console.log(data);

  return data.data.playbackUrls[0].url.split("?")[0];
};

main();
