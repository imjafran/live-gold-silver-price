# Live Gold Silver Price API

A lightweight and high-performance Cloudflare Worker that fetches, parses, and caches the latest gold and silver prices from the Bangladesh Jeweller's Association (BAJUS) website.

## API Endpoint

```
https://gsp.minbars.net
```

## Features

- **Real-time Price Data**: Fetches current gold and silver prices directly from the official BAJUS website
- **High Performance**: Edge caching ensures sub-10ms response times for most requests
- **Lightweight JSON Responses**: Clean, minimal JSON structure for easy integration
- **Reliable**: Built-in error handling with graceful degradation
- **CORS Enabled**: Can be called from any frontend application

## Example Response

```json
{
  "timestamp": "2025-04-30T12:34:56.789Z",
  "unit": "BDT/GRAM",
  "gold": [
    {
      "name": "22 KARAT Gold",
      "price": 14793
    },
    {
      "name": "21 KARAT Gold",
      "price": 14120
    },
    {
      "name": "18 KARAT Gold",
      "price": 12103
    },
    {
      "name": "TRADITIONAL Gold",
      "price": 10012
    }
  ],
  "silver": [
    {
      "name": "22 KARAT Silver",
      "price": 244
    },
    {
      "name": "21 KARAT Silver",
      "price": 233
    },
    {
      "name": "18 KARAT Silver",
      "price": 200
    },
    {
      "name": "TRADITIONAL Silver",
      "price": 150
    }
  ]
}
```

## Integration Examples

### JavaScript / AJAX

```javascript
fetch('https://gsp.minbars.net')
  .then(response => response.json())
  .then(data => {
    console.log('Gold price (22K):', data.gold[0].price, 'BDT/gram');
    // Use the data to update your UI
  })
  .catch(error => console.error('Error fetching prices:', error));
```

### React

```jsx
import { useState, useEffect } from 'react';

function GoldPriceDisplay() {
  const [priceData, setPriceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const response = await fetch('https://gsp.minbars.net');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setPriceData(data);
        setIsLoading(false);
      } catch (error) {
        setError(error.message);
        setIsLoading(false);
      }
    }

    fetchPrices();
  }, []);

  if (isLoading) return <div>Loading prices...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!priceData) return null;

  return (
    <div className="price-board">
      <h2>Today's Gold Prices</h2>
      <p>Last updated: {new Date(priceData.timestamp).toLocaleString()}</p>
      <ul>
        {priceData.gold.map((item, index) => (
          <li key={index}>
            {item.name}: {item.price.toLocaleString()} {priceData.unit}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### PHP

```php
<?php
$url = 'https://gsp.minbars.net';
$response = file_get_contents($url);

if ($response === false) {
    die('Error fetching gold prices');
}

$data = json_decode($response, true);

if ($data === null) {
    die('Error parsing JSON response');
}

// Use the data
echo "22 KARAT Gold price: " . number_format($data['gold'][0]['price']) . " BDT/gram\n";
?>
```

## Technical Implementation

The API is implemented as a Cloudflare Worker with the following optimization features:

1. **Efficient HTML Parsing**: Uses regex-based extraction to parse only the relevant data from the BAJUS website
2. **Cloudflare Cache**: Implements edge caching with a 1-hour TTL to minimize latency and reduce load on the source website
3. **Error Handling**: Comprehensive error handling with appropriate HTTP status codes and error messages
4. **CORS Support**: Full cross-origin resource sharing support for frontend integrations

## How It Works

1. When a request is received, the worker first checks if a cached response exists
2. If found in cache, it immediately returns the cached data (typical response time: 5-10ms)
3. If not found in cache:
   - Fetches the HTML content from BAJUS website
   - Parses the gold and silver price tables
   - Structures the data as JSON
   - Caches the response for future requests
   - Returns the JSON data

## License

MIT License

## Disclaimer

This API is not officially affiliated with BAJUS (Bangladesh Jeweller's Association). It is provided as a convenience for developers who need access to the latest gold and silver prices in Bangladesh. The data is sourced directly from the official BAJUS website.

## Source Code

The complete Cloudflare Worker code is available in this repository.

## Contribution

Contributions are welcome! Please feel free to submit a Pull Request.
