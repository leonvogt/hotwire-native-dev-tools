# hotwire-native-dev-tools

## Installation

```bash
npm install hotwire-native-dev-tools
```

or 

```bash
yarn add hotwire-native-dev-tools
```

## Usage

```js
import { setupDevTools } from 'hotwire-native-dev-tools';
setupDevTools();
```

## Development

> [!IMPORTANT]
> Since this DevTools listens to console logs, it is important to not use `console.log` (or .warn, .error, etc.) in the DevTools code itself. This will cause an infinite loop 😅

In the root of the project run:
```bash
yarn link
```

In the project you want to use the package run:
```bash
yarn link hotwire-native-dev-tools
```
