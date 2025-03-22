# Hotwire Native DevTools

## Usage

```js
import { setupDevTools } from 'hotwire-native-dev-tools';
setupDevTools();
```

## Development

- Fork the project locally
- `npm install`
- `npm run dev`

**Setting Up the Package Locally**     
One way to link the package locally is to use `yarn link`.    
This allows you to develop the package and test it in another project.

In the root of this project run:
```bash
yarn link
```

In the project you want to use the package run:
```bash
yarn link hotwire-native-dev-tools
```
