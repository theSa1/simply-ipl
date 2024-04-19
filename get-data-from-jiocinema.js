import fs from "fs";
import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

const { ACCESS_TOKEN, MATCH_ID } = process.env;

const main = async () => {
  const res = await fetch(
    `https://content-jiovoot.voot.com/psapi/voot/v1/voot-web/content/query/asset-details?&ids=include:${MATCH_ID}&responseType=common&devicePlatformType=desktop`
  );

  const data = await res.json();

  console.log(data);

  const title = data.result[0].fullTitle;
  const thumbnail = "https://v3img.voot.com/" + data.result[0].imageUri;

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
