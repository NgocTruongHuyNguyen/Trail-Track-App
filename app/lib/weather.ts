export type WeatherData = {
  temperature: number
  windSpeed: number
  weatherCode: number
  description: string
  isDay: boolean
}

// Maps Open-Meteo's numeric weather codes to human-readable descriptions
function getWeatherDescription(code: number): string {
  const map: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
  }
  return map[code] || 'Unknown conditions'
}

function getWeatherEmoji(code: number, isDay: boolean): string {
  if (code === 0) return isDay ? '☀️' : '🌙'
  if (code <= 2) return isDay ? '🌤️' : '☁️'
  if (code === 3) return '☁️'
  if (code <= 48) return '🌫️'
  if (code <= 55) return '🌦️'
  if (code <= 65) return '🌧️'
  if (code <= 75) return '🌨️'
  if (code <= 82) return '🌧️'
  if (code >= 95) return '⛈️'
  return '🌡️'
}

export { getWeatherDescription, getWeatherEmoji }

export async function fetchWeather(latitude: number, longitude: number): Promise<WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,weather_code,is_day`
    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    const current = data.current

    return {
      temperature: current.temperature_2m,
      windSpeed: current.wind_speed_10m,
      weatherCode: current.weather_code,
      description: getWeatherDescription(current.weather_code),
      isDay: current.is_day === 1,
    }
  } catch (e) {
    return null
  }
}