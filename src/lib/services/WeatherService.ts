import axios from 'axios';

export class WeatherService {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async getWeather(location: string): Promise<string> {
        try {
            const geo = await this.geocode(location);
            if (!geo) return `I couldn't find the location "${location}".`;

            const { name, latitude, longitude, country, admin1, country_code } = geo;

            // Check if US location to prioritize NWS
            if (country_code === 'US') {
                const observations = await this.getNWSObservations(latitude, longitude);
                if (observations) return `Current conditions for **${name}, ${admin1 || ''}** (NWS):\n${observations}`;

                // Fallback to forecast period 0 if observations fail
                const forecastData = await this.getNWSForecastByCoords(latitude, longitude, name, admin1);
                if (forecastData && !forecastData.startsWith('Failed')) return forecastData;
            }

            // OpenWeatherMap Current Weather API - using imperial units
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${this.apiKey}&units=imperial`;
            const response = await axios.get(url, { headers: { 'User-Agent': 'SkySentinelDiscordBot/1.0 (contact@skysentinel.bot)' } });
            const data = response.data;

            const owmName = data.name;
            const owmCountry = data.sys.country;
            const temp = data.main.temp;
            const feelsLike = data.main.feels_like;
            const description = data.weather[0]?.description || 'Clear';
            const humidity = data.main.humidity;
            const windSpeed = data.wind.speed; // mph by default with units=imperial

            return `Current weather in ${owmName}, ${owmCountry}:
- Condition: ${description}
- Temperature: ${temp.toFixed(1)}°F (Feels like ${feelsLike.toFixed(1)}°F)
- Wind: ${windSpeed.toFixed(1)} mph
- Humidity: ${humidity}%`;
        } catch (error: any) {
            if (error.response?.status === 401) {
                return "The weather service is currently unavailable (Invalid API Key).";
            }
            if (error.response?.status === 404) {
                return `I couldn't find the weather for "${location}". Please check the spelling.`;
            }
            console.error('[WeatherService] Error:', error.response?.data || error.message);
            return "Failed to fetch weather data.";
        }
    }

    async getForecast(location: string): Promise<string> {
        try {
            const geo = await this.geocode(location);
            if (!geo) return `I couldn't find the location "${location}" for a weather forecast.`;

            const { name, latitude, longitude, country, admin1, country_code } = geo;

            // If US, attempt NWS first
            if (country_code === 'US') {
                const nwsData = await this.getNWSForecastByCoords(latitude, longitude, name, admin1);
                if (nwsData && !nwsData.startsWith('Failed')) return nwsData;
            }

            // 2. Weather Data (Fetching 5 days of daily data for forecast)
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&temperature_unit=fahrenheit&wind_speed_unit=mph`;
            const weatherRes = await axios.get(weatherUrl);
            const daily = weatherRes.data.daily;

            const weatherCodeToText = (code: number) => {
                if (code === 0) return 'Clear';
                if (code >= 1 && code <= 3) return 'Partly cloudy';
                if (code >= 45 && code <= 48) return 'Fog';
                if (code >= 51 && code <= 67) return 'Rain';
                if (code >= 71 && code <= 77) return 'Snow';
                if (code >= 80 && code <= 82) return 'Showers';
                if (code >= 95 && code <= 99) return 'Thunderstorm';
                return 'Mixed conditions';
            };

            let forecastText = `5-Day Forecast for ${name}, ${admin1 || ''} ${country}:\n`;
            for (let i = 1; i < 6; i++) {
                if (daily.time[i]) {
                    const date = new Date(daily.time[i]).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    const maxTemp = daily.temperature_2m_max[i].toFixed(1);
                    const minTemp = daily.temperature_2m_min[i].toFixed(1);
                    const condition = weatherCodeToText(daily.weathercode[i]);
                    forecastText += `- ${date}: ${condition}, High ${maxTemp}°F, Low ${minTemp}°F\n`;
                }
            }

            return forecastText;

        } catch (error: any) {
            console.error('[WeatherService Forecast] Error:', error.message);
            return "Failed to fetch the 5-day weather forecast.";
        }
    }

    private async geocode(location: string): Promise<any | null> {
        try {
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
            const geoRes = await axios.get(geoUrl);
            if (!geoRes.data.results || geoRes.data.results.length === 0) return null;
            return geoRes.data.results[0];
        } catch (e) {
            return null;
        }
    }

    private async getNWSForecast(location: string): Promise<string | null> {
        const geo = await this.geocode(location);
        if (!geo || geo.country_code !== 'US') return null;
        return await this.getNWSForecastByCoords(geo.latitude, geo.longitude, geo.name, geo.admin1);
    }

    private async getNWSObservations(lat: number, lon: number): Promise<string | null> {
        const headers = { 'User-Agent': 'SkySentinelDiscordBot/1.0 (contact@skysentinel.bot)' };
        try {
            // 1. Get nearest stations
            const stationsUrl = `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}/stations`;
            const stationsRes = await axios.get(stationsUrl, { headers });
            const stations = stationsRes.data.features;
            if (!stations || stations.length === 0) return null;

            const stationId = stations[0].properties.stationIdentifier;

            // 2. Get latest observations
            const obsUrl = `https://api.weather.gov/stations/${stationId}/observations/latest`;
            const obsRes = await axios.get(obsUrl, { headers });
            const props = obsRes.data.properties;

            const tempC = props.temperature.value;
            const tempF = tempC ? (tempC * 9 / 5 + 32).toFixed(1) : 'N/A';
            const description = props.textDescription || 'Unknown';
            const humidity = props.relativeHumidity.value?.toFixed(0) || 'N/A';
            const windSpeedKph = props.windSpeed.value;
            const windSpeedMph = windSpeedKph ? (windSpeedKph / 1.609).toFixed(1) : 'N/A';

            return `- Condition: ${description}\n- Temperature: ${tempF}°F\n- Wind: ${windSpeedMph} mph\n- Humidity: ${humidity}%`;
        } catch (e) {
            return null;
        }
    }

    private async getNWSForecastByCoords(lat: number, lon: number, name: string, state?: string): Promise<string | null> {
        const headers = { 'User-Agent': 'SkySentinelDiscordBot/1.0 (contact@skysentinel.bot)' };
        try {
            // 1. Get NWS Points metadata
            const pointsUrl = `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`;
            const pointsRes = await axios.get(pointsUrl, { headers });

            const forecastUrl = pointsRes.data.properties.forecast;
            if (!forecastUrl) return null;

            // 2. Get actual forecast
            const forecastRes = await axios.get(forecastUrl, { headers });
            const periods = forecastRes.data.properties.periods;
            if (!periods || periods.length === 0) return null;

            let text = `Official NWS Forecast for **${name}, ${state || ''}**:\n`;
            // Limit to next 5 periods (roughly 2.5 days) for concise output
            for (const period of periods.slice(0, 6)) {
                text += `**${period.name}:** ${period.shortForecast}. Temp: ${period.temperature}°${period.temperatureUnit}. ${period.detailedForecast}\n\n`;
            }
            return text;
        } catch (error: any) {
            console.error('[NWS API] Error:', error.message);
            return null;
        }
    }
}
