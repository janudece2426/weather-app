import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// We initialize GoogleGenAI with option headers for telemetry as instructed
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

const app = express();
const PORT = 3000;

app.use(express.json());

// API health endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", time: new Date().toISOString() });
});

// Weather API endpoint
app.post("/api/weather", async (req: express.Request, res: express.Response) => {
  const { city, lat, lng } = req.body;
  const targetCity = city ? city.trim() : "Seoul";
  
  const openWeatherKey = process.env.OPENWEATHERMAP_API_KEY;
  let weatherData: any = null;
  let source: "OpenWeather" | "Gemini AI Search" | "Default Simulator" = "Default Simulator";

  console.log(`Weather requested for [City: ${targetCity}, Lat: ${lat}, Lng: ${lng}]`);

  // --- Option A: OpenWeatherMap API ---
  if (openWeatherKey) {
    try {
      let currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(targetCity)}&units=metric&appid=${openWeatherKey}&lang=kr`;
      let forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(targetCity)}&units=metric&appid=${openWeatherKey}&lang=kr`;

      if (lat !== undefined && lng !== undefined) {
        currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${openWeatherKey}&lang=kr`;
        forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=metric&appid=${openWeatherKey}&lang=kr`;
      }

      console.log(`Attempting to fetch from OpenWeatherMap...`);
      const currentRes = await fetch(currentUrl);
      
      if (currentRes.ok) {
        const currentJson = await currentRes.json();
        const forecastRes = await fetch(forecastUrl);
        let forecastList = [];
        
        if (forecastRes.ok) {
          const forecastJson = await forecastRes.json();
          // Filter forecast list to get 1 item per day (every 8th item roughly represents 24 hours)
          const list = forecastJson.list || [];
          for (let i = 8; i < list.length; i += 8) {
            const item = list[i];
            const date = new Date(item.dt * 1000);
            const daysK = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
            const dayOfW = daysK[date.getDay()];
            
            forecastList.push({
              day: dayOfW,
              temp: Math.round(item.main.temp),
              humidity: Math.round(item.main.humidity),
              condition: mapOpenWeatherCondition(item.weather?.[0]?.id),
              conditionText: item.weather?.[0]?.description || "맑음",
            });
            if (forecastList.length >= 4) break;
          }
        }

        // If forecast was limited or empty, populate with some simulated variations based on current
        if (forecastList.length === 0) {
          forecastList = generateFallbackForecast(currentJson.main.temp);
        }

        const conditionVal = mapOpenWeatherCondition(currentJson.weather?.[0]?.id);
        const conditionText = currentJson.weather?.[0]?.description || "맑음";
        const tempVal = Math.round(currentJson.main.temp);
        const humidityVal = Math.round(currentJson.main.humidity);

        // Standard tips based on conditions in clear Korean
        const dynamicTip = getStandardConditionTip(conditionVal, tempVal);

        weatherData = {
          location: currentJson.name || targetCity,
          source: "OpenWeather",
          current: {
            temp: tempVal,
            feelsLike: Math.round(currentJson.main.feels_like),
            humidity: humidityVal,
            condition: conditionVal,
            conditionText: conditionText,
            windSpeed: `${currentJson.wind?.speed || 0} m/s`,
            airQuality: "보통", // OpenWeather basic API doesn't include AQI, we set standard average
            lastUpdated: new Date().toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" }),
            tip: dynamicTip,
          },
          forecast: forecastList,
        };
        source = "OpenWeather";
      } else {
        console.warn(`OpenWeatherMap returned code ${currentRes.status}. Falling back to Gemini search/simulator...`);
      }
    } catch (err) {
      console.error("OpenWeather API error, falling back to backup method:", err);
    }
  }

  // --- Option B: Gemini AI Search Grounding ---
  if (!weatherData && ai) {
    try {
      console.log(`Initiating fallback model logic: Gemini AI Search Grounding...`);
      const searchPrompt = `Search Google for the absolute latest, current weather details for target city "${targetCity}" (using coordinates lat: ${lat}, lng: ${lng} if provided). 
Look up: 
1. Real-time temperature in Celsius.
2. Humidity in %.
3. Wind speed.
4. Current air quality rating (e.g. 좋음, 보통, 나쁨, 매우나쁨).
5. Current specific meteorological weather category (choose the best match from only: 'sunny', 'cloudy', 'rainy', 'snowy', 'stormy', 'windy', 'foggy').
6. Simple Korean condition translation description (e.g., '맑음', '흐림', '구름 조금', '비', '천둥번개', '안개', '쌀쌀한 바람' etc.).
7. A 3-day or 4-day daily forecast trend of days (including day names in Korean, e.g. "내일", "모레", "일요일", target temperatures, humidity, and condition).
8. A cheerful, helpful, or slightly humorous 1-sentence weather tip in Korean (make it warm and localized to Korea's current season or the weather, e.g. "오늘은 선선한 바람과 함께 산책하기 좋은 날씨네요!").

Return ONLY a valid JSON object matching the JSON schema below. DO NOT enclose with markdown tags, backticks or code fencing. Start directly with { and end with }.

JSON schema to return:
{
  "location": "Localized city and region name",
  "current": {
    "temp": number,
    "feelsLike": number,
    "humidity": number,
    "condition": "sunny" | "cloudy" | "rainy" | "snowy" | "stormy" | "windy" | "foggy",
    "conditionText": "string",
    "windSpeed": "string with unit (e.g. 3m/s or 12km/h)",
    "airQuality": "string",
    "tip": "Humorous/witty 1-sentence Korean tip"
  },
  "forecast": [
    {
      "day": "Day name in Korean (e.g. 내일, 토요일)",
      "temp": number,
      "humidity": number,
      "condition": "sunny" | "cloudy" | "rainy" | "snowy" | "stormy" | "windy" | "foggy",
      "conditionText": "string"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: searchPrompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      if (response && response.text) {
        const cleanedText = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
        const geminiWeather = JSON.parse(cleanedText);
        
        weatherData = {
          location: geminiWeather.location || targetCity,
          source: "Gemini AI Search",
          current: {
            temp: Math.round(Number(geminiWeather.current?.temp ?? 20)),
            feelsLike: Math.round(Number(geminiWeather.current?.feelsLike ?? 20)),
            humidity: Math.round(Number(geminiWeather.current?.humidity ?? 60)),
            condition: geminiWeather.current?.condition || "sunny",
            conditionText: geminiWeather.current?.conditionText || "흐림 없음",
            windSpeed: geminiWeather.current?.windSpeed || "2.1 m/s",
            airQuality: geminiWeather.current?.airQuality || "보통",
            lastUpdated: new Date().toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" }),
            tip: geminiWeather.current?.tip || "오늘 기분이 좋아지길 바래요!",
          },
          forecast: (geminiWeather.forecast || []).map((f: any) => ({
            day: f.day || "내일",
            temp: Math.round(Number(f.temp ?? 20)),
            humidity: Math.round(Number(f.humidity ?? 60)),
            condition: f.condition || "sunny",
            conditionText: f.conditionText || "맑음",
          })),
        };
        source = "Gemini AI Search";
      }
    } catch (err) {
      console.error("Gemini AI Search weather retrieval error:", err);
    }
  }

  // --- Fallback Option C: Elegant Weather Simulator ---
  if (!weatherData) {
    console.log("Utilizing offline robust simulation algorithm...");
    // Let's generate extremely realistic dynamic weather data based on city name matching
    // to keep the app gorgeous, responsive, and functional as a solid backup.
    const lowercaseCity = targetCity.toLowerCase();
    let computedTemp = 21;
    let computedHumidity = 55;
    let conditionCode: "sunny" | "cloudy" | "rainy" | "snowy" | "stormy" | "windy" | "foggy" = "sunny";
    let conditionText = "맑음";
    let wind = "2.4 m/s";
    let airQuality = "좋음";

    if (lowercaseCity.includes("seoul") || lowercaseCity.includes("서울")) {
      computedTemp = 18;
      computedHumidity = 52;
      conditionCode = "sunny";
      conditionText = "맑음";
    } else if (lowercaseCity.includes("busan") || lowercaseCity.includes("부산") || lowercaseCity.includes("jeju") || lowercaseCity.includes("제주")) {
      computedTemp = computedTemp + 2;
      computedHumidity = 65;
      conditionCode = "cloudy";
      conditionText = "구름 많음";
      wind = "4.1 m/s";
    } else if (lowercaseCity.includes("london") || lowercaseCity.includes("런던")) {
      computedTemp = 14;
      computedHumidity = 80;
      conditionCode = "rainy";
      conditionText = "이슬비";
    } else if (lowercaseCity.includes("tokyo") || lowercaseCity.includes("도쿄")) {
      computedTemp = 19;
      computedHumidity = 60;
      conditionCode = "cloudy";
      conditionText = "흐림";
    } else if (lowercaseCity.includes("new york") || lowercaseCity.includes("뉴욕")) {
      computedTemp = 16;
      computedHumidity = 48;
      conditionCode = "windy";
      conditionText = "바람 많이 붊";
      wind = "6.5 m/s";
    } else {
      // Semi-random deterministic based on string hashing to represent realistic variance
      const hash = targetCity.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      computedTemp = (hash % 25) + 5; // 5 to 30 deg
      computedHumidity = (hash % 50) + 40; // 40 to 90 %
      const conditions: Array<"sunny" | "cloudy" | "rainy" | "snowy" | "stormy" | "windy" | "foggy"> = ["sunny", "cloudy", "rainy", "windy", "foggy"];
      conditionCode = conditions[hash % conditions.length];
      
      const conditionTexts = {
        sunny: "대체로 맑음",
        cloudy: "흐림",
        rainy: "구름 많고 비",
        snowy: "눈 내림",
        stormy: "뇌우",
        windy: "강한 바람",
        foggy: "짙은 안개",
      };
      conditionText = conditionTexts[conditionCode];
    }

    const standardTip = getStandardConditionTip(conditionCode, computedTemp);

    weatherData = {
      location: targetCity.charAt(0).toUpperCase() + targetCity.slice(1),
      source: "Default Simulator",
      current: {
        temp: computedTemp,
        feelsLike: computedTemp - 1,
        humidity: computedHumidity,
        condition: conditionCode,
        conditionText: conditionText,
        windSpeed: wind,
        airQuality: airQuality,
        lastUpdated: new Date().toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" }),
        tip: standardTip,
      },
      forecast: generateFallbackForecast(computedTemp, conditionCode),
    };
  }

  return res.json(weatherData);
});

// Weather state mapper
function mapOpenWeatherCondition(id?: number): "sunny" | "cloudy" | "rainy" | "snowy" | "stormy" | "windy" | "foggy" {
  if (!id) return "sunny";
  if (id >= 200 && id < 300) return "stormy";
  if (id >= 300 && id < 600) return "rainy";
  if (id >= 600 && id < 700) return "snowy";
  if (id >= 701 && id < 800) return "foggy";
  if (id === 800) return "sunny";
  if (id > 800 && id < 804) return "cloudy";
  if (id === 804) return "cloudy";
  return "cloudy";
}

function getStandardConditionTip(condition: string, temp: number): string {
  if (temp < 5) {
    return "날씨가 꽤 춥습니다. 따뜻한 외투와 목도리를 꼭 챙기시고 건강에 유의하세요!";
  }
  if (temp > 28) {
    return "햇살이 뜨거운 한여름 날씨입니다. 충분한 수분 섭취와 비타민 충전을 잊지 마세요! 🌞";
  }
  
  switch (condition) {
    case "sunny":
      return "오늘은 하늘이 아주 맑고 화창하네요. 기분 좋은 산책을 즐기기 위해 밖으로 나서볼까요?";
    case "cloudy":
      return "하늘에 구름이 가득 찬 흐린 날입니다. 은은한 필터링 채광 속에 차 한잔의 여유를 즐겨보세요.";
    case "rainy":
      return "추적추적 기분 좋은 빗소리가 들립니다. 외출하실 때 우산을 잊지 말고 꼭 챙기세요. ☔";
    case "snowy":
      return "온 세상이 하얗게 덮이는 눈 오는 날입니다! 길이 미끄러울 수 있으니 걸음마다 조심하세요. ❄️";
    case "stormy":
      return "천둥번개를 동반한 거친 날씨입니다. 가급적 안전하고 아늑한 실내에 머무르는 것을 권장해요.";
    case "windy":
      return "바람이 매우 싱그럽게 부는 날입니다. 날리는 머리칼을 정리하며 시원한 바람결을 느껴보세요.";
    case "foggy":
      return "눈앞이 하얗게 흐려지는 안개 낀 날입니다. 가시거리가 짧으니 온종일 서행 및 안전운전 하세요.";
    default:
      return "기분 좋은 행운이 가득한 오늘 하루가 되시기를 바랍니다!";
  }
}

function generateFallbackForecast(baseTemp: number, conditionCode: "sunny" | "cloudy" | "rainy" | "snowy" | "stormy" | "windy" | "foggy" = "sunny") {
  const days = ["내일", "모레", "글피(3일 뒤)", "4일 뒤"];
  const conditions: Array<"sunny" | "cloudy" | "rainy" | "snowy" | "stormy" | "windy" | "foggy"> = ["sunny", "cloudy", "rainy", "windy", "foggy"];
  const condTexts = {
    sunny: "맑음",
    cloudy: "대체로 흐림",
    rainy: "가끔 비",
    snowy: "진눈깨비",
    stormy: "뇌우 동반",
    windy: "바람 많이 붊",
    foggy: "옅은 안개",
  };

  return days.map((day, index) => {
    // Generate realistic variance
    const tempOffset = [1, -2, -1, 2][index] || 0;
    const humOffset = [5, -8, 12, -4][index] || 0;
    
    // Choose weather logically, staying somewhat close to current condition
    let chosenCond = conditionCode;
    if (index > 0) {
      const idx = (baseTemp + index) % conditions.length;
      chosenCond = conditions[idx];
    }

    return {
      day,
      temp: baseTemp + tempOffset,
      humidity: Math.min(Math.max(45 + humOffset, 20), 100),
      condition: chosenCond,
      conditionText: condTexts[chosenCond],
    };
  });
}

// Start application server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Initialize vite server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server launched and listening on port ${PORT}...`);
  });
}

startServer();
