function updateDateTime() {
    const now = new Date();
    document.getElementById('datetime').innerText = now.toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}
setInterval(updateDateTime, 1000);
updateDateTime();

async function getWeather() {
    const city = document.getElementById('city').value.trim();
    const weatherDiv = document.getElementById('weather');
    
    if (!city) {
        showError('Please enter a city name!');
        return;
    }

    if (!/^[a-zA-Z\s]+$/.test(city)) {
        showError('Please enter a valid city name (letters only)');
        return;
    }

    const apiKey = '47be850833c39e57b4399feab285c3a0';
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
    
    weatherDiv.innerHTML = '<div class="loader"></div>';
    
    try {
        const [weatherResponse, forecastResponse] = await Promise.all([
            fetch(weatherUrl),
            fetch(forecastUrl)
        ]);
        
        if (!weatherResponse.ok || !forecastResponse.ok) {
            throw new Error('City not found or API error');
        }

        const weatherData = await weatherResponse.json();
        const forecastData = await forecastResponse.json();

        const forecastsByDate = {};
        forecastData.list.forEach(entry => {
            const date = new Date(entry.dt * 1000).toLocaleDateString();
            if (!forecastsByDate[date]) {
                forecastsByDate[date] = {
                    temps: [],
                    descriptions: new Set(),
                    entries: []
                };
            }
            forecastsByDate[date].temps.push(entry.main.temp);
            forecastsByDate[date].descriptions.add(entry.weather[0].description);
            forecastsByDate[date].entries.push(entry);
        });

        const dailyForecasts = Object.entries(forecastsByDate)
            .slice(0, 7)
            .map(([date, data]) => {
                const avgTemp = (data.temps.reduce((a, b) => a + b, 0) / data.temps.length).toFixed(1);
                return {
                    date,
                    avgTemp,
                    description: Array.from(data.descriptions).join(', '),
                    entry: data.entries[Math.floor(data.entries.length / 2)]
                };
            });

        const hourlyForecasts = forecastData.list
            .filter((_, index) => index % 2 === 0)
            .slice(0, 12);

        weatherDiv.innerHTML = `
            <div class="weather-sections">
                <div class="weather-card">
                    <h3>Current Weather</h3>
                    <div class="weather-grid">
                        <div class="weather-item">
                            <h4>Temperature</h4>
                            <p>${weatherData.main.temp}°C</p>
                        </div>
                        <div class="weather-item">
                            <h4>Feels Like</h4>
                            <p>${weatherData.main.feels_like}°C</p>
                        </div>
                        <div class="weather-item">
                            <h4>Humidity</h4>
                            <p>${weatherData.main.humidity}%</p>
                        </div>
                        <div class="weather-item">
                            <h4>Wind</h4>
                            <p>${weatherData.wind.speed} m/s</p>
                        </div>
                    </div>
                </div>

                <div class="weather-card">
                    <h3>7-Day Forecast</h3>
                    <div class="forecast-container">
                        ${dailyForecasts.map(day => `
                            <div class="weather-item">
                                <h4>${new Date(day.entry.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}</h4>
                                <p>${day.avgTemp}°C</p>
                                <small>${day.description}</small>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="weather-card">
                    <h3>12-Hour Forecast</h3>
                    <div class="hourly-forecast">
                        ${hourlyForecasts.map(hour => `
                            <div class="weather-item">
                                <h4>${new Date(hour.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h4>
                                <p>${hour.main.temp}°C</p>
                                <small>${hour.weather[0].description}</small>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        showError(error.message.includes('City not found') ? 
            'City not found. Please check spelling.' : 
            'Error fetching weather data. Please try again later.');
    }
}

function showError(message) {
    const weatherDiv = document.getElementById('weather');
    weatherDiv.innerHTML = `<div class="error">${message}</div>`;
    setTimeout(() => {
        weatherDiv.querySelector('.error').style.opacity = '0.8';
    }, 5000);
}