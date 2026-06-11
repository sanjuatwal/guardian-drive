export type ThemeAsset = {
  key: string;
  filename: string;
  usage: string;
};

export const themeAssets: ThemeAsset[] = [
  {
    key: "brandLogo",
    filename: "brand-logo.png",
    usage: "Top app logo mark and wordmark",
  },
  {
    key: "dashboardCar",
    filename: "dashboard-car.png",
    usage: "Main dashboard hero car image",
  },
  {
    key: "alertRadar",
    filename: "alert-radar.png",
    usage: "Critical alert center visual",
  },
  {
    key: "mapRecovery",
    filename: "map-recovery.png",
    usage: "Live recovery path map visual",
  },
  {
    key: "protectionHealth",
    filename: "protection-health.png",
    usage: "Protection center card art",
  },
  {
    key: "textureNoise",
    filename: "texture-noise.png",
    usage: "Subtle app background noise texture",
  },
];

export const themeAssetNames = themeAssets.reduce<Record<string, string>>((accumulator, asset) => {
  accumulator[asset.key] = asset.filename;
  return accumulator;
}, {});
